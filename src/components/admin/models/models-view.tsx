import { AiChat02Icon, CloudOffIcon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import type { CuratedModel, SurplusTextModel } from "@/lib/gateway/catalog-contract";
import { type CatalogModel, CatalogTable } from "./catalog-table";
import { type CatalogState, type CuratedRow, CuratedTable } from "./curated-table";
import { modelsCopy as copy } from "./models-copy";

type ModelsViewProps = { curated: CuratedModel[]; surplus: SurplusTextModel[] | null };

/** §7.1: list prices change on Surplus; the sell price does not follow by itself, the admin decides. */
function catalogState(row: CuratedModel, surplus: Map<string, SurplusTextModel> | null): CatalogState {
  if (!surplus) return { kind: "unknown" };
  const now = surplus.get(row.modelId);
  if (!now) return { kind: "gone" };
  if (now.listInputMicros === row.listInputMicros && now.listOutputMicros === row.listOutputMicros) return { kind: "same" };
  return { kind: "changed", nowIn: now.listInputMicros, nowOut: now.listOutputMicros };
}

export function ModelsView({ curated, surplus }: ModelsViewProps) {
  const byId = surplus && new Map(surplus.map((m) => [m.modelId, m]));
  const rows: CuratedRow[] = curated.map((m) => ({ ...m, catalog: catalogState(m, byId) }));
  const active = curated.filter((m) => m.active).length;
  // Only what the table shows goes to the client.
  const catalog: CatalogModel[] | null = surplus && surplus.map((m) => ({
    modelId: m.modelId, name: m.name, provider: m.provider, contextLength: m.contextLength, supportsImages: m.supportsImages,
    listInputMicros: m.listInputMicros, listOutputMicros: m.listOutputMicros,
  }));

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-10">
        <Card title={copy.curated.title} description={`${copy.curated.count(active, curated.length)} ${copy.perM}`}>
          {rows.length ? (
            <CuratedTable rows={rows} />
          ) : (
            <EmptyState icon={AiChat02Icon} title={copy.curated.empty.title} body={copy.curated.empty.body} />
          )}
        </Card>
        <Card title={copy.surplus.title} description={copy.perM}>
          {catalog ? (
            <CatalogTable models={catalog} curatedIds={curated.map((m) => m.modelId)} />
          ) : (
            <EmptyState icon={CloudOffIcon} title={copy.surplus.failed.title} body={copy.surplus.failed.body} />
          )}
        </Card>
      </div>
    </>
  );
}
