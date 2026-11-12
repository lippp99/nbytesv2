// Curated model catalog (PRD gateway-api §6, gateway-pricing-billing §7.1, D4). The Surplus catalog shape was checked
// against GET https://api.surplusintelligence.ai/v1/models on 2026-11-12 (527 models): `pricing.prompt` and
// `pricing.completion` are USD per token as decimal strings, `top_provider.max_completion_tokens` is set on every model.
import { MAX_MARKUP_BP, MIN_MARKUP_BP, usdPerTokenToMicrosPerM } from "./price-math.ts";

export type SurplusTextModel = {
  modelId: string;
  name: string;
  provider: string | null;
  contextLength: number | null;
  maxCompletionTokens: number | null;
  supportsImages: boolean;
  listInputMicros: number;
  listOutputMicros: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const positiveInt = (value: unknown) => (typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null);
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);

/**
 * One entry of the Surplus catalog, if it is a text model with exact token prices; else null. Images: input_modalities
 * OR supported_features is enough, as the Surplus router treats it [S5, S11].
 */
export function parseSurplusModel(raw: unknown): SurplusTextModel | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || !isRecord(raw.pricing) || !isRecord(raw.architecture)) return null;
  if (!strings(raw.architecture.output_modalities).includes("text")) return null;
  const listInputMicros = usdPerTokenToMicrosPerM(raw.pricing.prompt);
  const listOutputMicros = usdPerTokenToMicrosPerM(raw.pricing.completion);
  if (listInputMicros === null || listOutputMicros === null) return null;
  const top = isRecord(raw.top_provider) ? raw.top_provider : {};
  return {
    modelId: raw.id,
    name: typeof raw.name === "string" && raw.name ? raw.name : raw.id,
    provider: typeof raw.provider === "string" && raw.provider ? raw.provider : null,
    contextLength: positiveInt(raw.context_length),
    maxCompletionTokens: positiveInt(top.max_completion_tokens),
    supportsImages:
      strings(raw.architecture.input_modalities).includes("image") || strings(raw.supported_features).includes("vision"),
    listInputMicros,
    listOutputMicros,
  };
}

/**
 * A list price of 0 (63 text models on 2026-11-12, written "0.0000000000" or "0"). Whether Surplus then charges nbytes
 * nothing is not documented and not tested, so such a model cannot be sold until that is known: it would be free to
 * users while nbytes might still pay.
 */
export const hasZeroListPrice = (m: Pick<SurplusTextModel, "listInputMicros" | "listOutputMicros">) =>
  m.listInputMicros === 0 || m.listOutputMicros === 0;

/** A curated model as the admin page shows it (model_prices row without timestamps). */
export type CuratedModel = Pick<SurplusTextModel, "modelId" | "name" | "contextLength" | "supportsImages" | "listInputMicros" |
  "listOutputMicros"> & { markupBp: number; inputMicros: number; outputMicros: number; active: boolean };

/** Body of POST /api/admin/models: add or update one curated model. */
export type ModelPriceBody = { modelId: string; markupBp: number; active: boolean };

export function parseModelPriceBody(json: unknown): ModelPriceBody | null {
  if (!isRecord(json)) return null;
  const { modelId, markupBp, active } = json;
  if (typeof modelId !== "string" || !/^[A-Za-z0-9._:/-]{1,200}$/.test(modelId)) return null;
  if (typeof markupBp !== "number" || !Number.isSafeInteger(markupBp)) return null;
  if (markupBp < MIN_MARKUP_BP || markupBp > MAX_MARKUP_BP || typeof active !== "boolean") return null;
  return { modelId, markupBp, active };
}

/**
 * An active model as the dashboard Models page shows it (PRD dashboard-models §5.1): sell prices per 1M tokens in
 * micro-USD. List prices and markup are nbytes' margin and never reach the browser.
 */
export type CatalogModel = {
  id: string;
  name: string;
  contextLength: number | null;
  maxCompletionTokens: number | null;
  supportsImages: boolean;
  inputMicros: number;
  outputMicros: number;
};

/** Public model entry (GET /api/v1/models): sell prices, in the same "USD per token" form as the Surplus catalog. */
export type PublicModel = {
  id: string; object: "model"; created: number; owned_by: "nbytes"; name: string; context_length: number | null;
  pricing: { prompt: string; completion: string };
};

/** micro-USD per 1M tokens -> USD per token with 12 decimals (5_000_000 -> "0.000005000000"). */
export const microsPerMToUsdPerToken = (micros: number) =>
  `${Math.floor(micros / 1e12)}.${String(micros % 1e12).padStart(12, "0")}`;
