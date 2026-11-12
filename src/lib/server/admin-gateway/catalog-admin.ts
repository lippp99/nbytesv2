import "server-only";
import { asc, eq } from "drizzle-orm";
import {
  type CuratedModel, type ModelPriceBody, type SurplusTextModel, hasZeroListPrice, parseSurplusModel,
} from "@/lib/gateway/catalog-contract";
import { applyMarkupMicros } from "@/lib/gateway/price-math";
import { logServerError } from "../auth/request-guard";
import { db } from "../db/client";
import { logAdminEvent } from "../admin-auth/audit";
import { modelPrices } from "../db/schema";
import { AppError } from "../errors";
import { fetchSurplusCatalog } from "../gateway/surplus-client";

// Admin side of the curated catalog (D4, PRD gateway-pricing-billing §7.1). Callers check the admin session.

export type AdminCatalog = {
  curated: CuratedModel[];
  /** Text models of the Surplus catalog, read live; null when Surplus could not be read. */
  surplus: SurplusTextModel[] | null;
};

async function surplusTextModels(): Promise<SurplusTextModel[]> {
  const raw = await fetchSurplusCatalog();
  return raw.flatMap((m) => parseSurplusModel(m) ?? []).sort((a, b) => a.modelId.localeCompare(b.modelId));
}

/** The admin page: curated rows from the database and the live Surplus catalog, read in parallel. */
export async function adminCatalog(): Promise<AdminCatalog> {
  const [curated, surplus] = await Promise.all([
    db
      .select({
        modelId: modelPrices.modelId, name: modelPrices.name, contextLength: modelPrices.contextLength,
        supportsImages: modelPrices.supportsImages, listInputMicros: modelPrices.listInputMicros,
        listOutputMicros: modelPrices.listOutputMicros, markupBp: modelPrices.markupBp, inputMicros: modelPrices.inputMicros,
        outputMicros: modelPrices.outputMicros, active: modelPrices.active,
      })
      .from(modelPrices)
      .orderBy(asc(modelPrices.modelId)),
    surplusTextModels().catch((error) => {
      logServerError(error);
      return null;
    }),
  ]);
  return { curated, surplus };
}

/**
 * Turning a model off needs nothing from Surplus, so it works while Surplus is down or after it dropped the model.
 * Turning on or changing markup reads list prices fresh from the catalog: sell = list × (1 + markup). A list price of
 * 0 is refused (hasZeroListPrice). Every change goes to the audit log.
 */
export async function saveModelPrice(adminId: string, body: ModelPriceBody, ipHash: string): Promise<void> {
  if (!body.active) return disableModel(adminId, body.modelId, ipHash);
  let catalog: SurplusTextModel[];
  try {
    catalog = await surplusTextModels();
  } catch (error) {
    throw new AppError("unavailable", 503, {}, undefined, { cause: error });
  }
  const model = catalog.find((m) => m.modelId === body.modelId);
  if (!model) throw new AppError("model_not_found", 404);
  if (hasZeroListPrice(model)) throw new AppError("blocked", 409);
  const prices = {
    name: model.name, contextLength: model.contextLength, maxCompletionTokens: model.maxCompletionTokens,
    supportsImages: model.supportsImages, listInputMicros: model.listInputMicros, listOutputMicros: model.listOutputMicros,
    markupBp: body.markupBp, active: true,
    inputMicros: applyMarkupMicros(model.listInputMicros, body.markupBp),
    outputMicros: applyMarkupMicros(model.listOutputMicros, body.markupBp),
    updatedAt: new Date(),
  };
  await db.transaction(async (tx) => {
    await tx
      .insert(modelPrices)
      .values({ modelId: model.modelId, ...prices })
      .onConflictDoUpdate({ target: modelPrices.modelId, set: prices });
    await logAdminEvent("model_price_set", { adminId, ipHash }, { target: model.modelId }, tx);
  });
}

async function disableModel(adminId: string, modelId: string, ipHash: string): Promise<void> {
  await db.transaction(async (tx) => {
    const changed = await tx
      .update(modelPrices)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(modelPrices.modelId, modelId))
      .returning({ modelId: modelPrices.modelId });
    if (!changed.length) throw new AppError("model_not_found", 404);
    await logAdminEvent("model_disabled", { adminId, ipHash }, { target: modelId }, tx);
  });
}
