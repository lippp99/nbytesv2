import type { CatalogModel } from "@/lib/gateway/catalog-contract";

// Search and sort of the Models page (PRD dashboard-models F4, R2). Pure, so it is tested without a browser.

export type SortKey = "name" | "input" | "output";

/** Case-insensitive match on name or id; an empty query keeps every model. */
export function filterModels(models: CatalogModel[], query: string): CatalogModel[] {
  const q = query.trim().toLowerCase();
  return q ? models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)) : models;
}

/** "name" keeps the server's A–Z order; a price key sorts cheapest first, ties by name. */
export function sortModels(models: CatalogModel[], key: SortKey): CatalogModel[] {
  if (key === "name") return models;
  const price = key === "input" ? (m: CatalogModel) => m.inputMicros : (m: CatalogModel) => m.outputMicros;
  return [...models].sort((a, b) => price(a) - price(b) || a.name.localeCompare(b.name));
}

/** Token count for a column, or an em dash when the catalog does not know it. */
export const formatTokens = (tokens: number | null, format: (n: number) => string) => (tokens === null ? "—" : format(tokens));
