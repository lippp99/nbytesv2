import "server-only";
import { cache } from "react";
import { and, asc, count, eq } from "drizzle-orm";
import { type CatalogModel, type PublicModel, microsPerMToUsdPerToken } from "@/lib/gateway/catalog-contract";
import { db } from "../db/client";
import { modelPrices } from "../db/schema";

// Curated catalog (D4, PRD gateway-pricing-billing §7.1). Only active rows can be called; ids must match exactly, so
// Surplus aliases cannot skip curation or pricing (gateway-api §6).

export type ActiveModel = typeof modelPrices.$inferSelect;

export async function activeModel(modelId: string): Promise<ActiveModel | null> {
  const [row] = await db.select().from(modelPrices).where(and(eq(modelPrices.modelId, modelId), eq(modelPrices.active, true)));
  return row ?? null;
}

function toPublic(row: ActiveModel): PublicModel {
  return {
    id: row.modelId, object: "model", created: Math.floor(row.createdAt.getTime() / 1000), owned_by: "nbytes",
    name: row.name, context_length: row.contextLength,
    pricing: { prompt: microsPerMToUsdPerToken(row.inputMicros), completion: microsPerMToUsdPerToken(row.outputMicros) },
  };
}

export async function listPublicModels(): Promise<PublicModel[]> {
  const rows = await db.select().from(modelPrices).where(eq(modelPrices.active, true)).orderBy(asc(modelPrices.modelId));
  return rows.map(toPublic);
}

/** Dashboard Models page: active models, name A–Z, only the columns the page shows (no list price, no markup). */
export async function listCatalogForUsers(): Promise<CatalogModel[]> {
  return db
    .select({
      id: modelPrices.modelId, name: modelPrices.name, contextLength: modelPrices.contextLength,
      maxCompletionTokens: modelPrices.maxCompletionTokens, supportsImages: modelPrices.supportsImages,
      inputMicros: modelPrices.inputMicros, outputMicros: modelPrices.outputMicros,
    })
    .from(modelPrices)
    .where(eq(modelPrices.active, true))
    .orderBy(asc(modelPrices.name), asc(modelPrices.modelId));
}

/** Active model count for the sidebar; cached per request, since the desktop sidebar and the mobile drawer both ask. */
export const countActiveModels = cache(async (): Promise<number> => {
  const [{ active }] = await db.select({ active: count() }).from(modelPrices).where(eq(modelPrices.active, true));
  return active;
});

export async function publicModel(modelId: string): Promise<PublicModel | null> {
  const row = await activeModel(modelId);
  return row && toPublic(row);
}
