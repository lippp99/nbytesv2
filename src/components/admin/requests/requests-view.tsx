import { LinkSquare02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/app-kit/badge";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { Pagination } from "@/components/app-kit/pagination";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import {
  type AdminRequestRow, type RequestQuery, type RequestsPage, marginMicros, requestsHref,
} from "@/lib/admin-gateway/request-log-contract";
import { formatUtc } from "@/lib/date-format";
import { formatMicros, formatSignedMicros } from "@/lib/price-format";
import { requestsCopy as copy, stateBadge } from "./requests-copy";
import { RequestsToolbar } from "./requests-toolbar";

const small = "block text-app-small text-app-text-3";
const dash = <span className="text-app-text-3">—</span>;
const count = (n: number | null) => (n === null ? dash : n.toLocaleString("en-US"));
const money = (n: number | null) => (n === null ? dash : formatMicros(n));

function Status({ row }: { row: AdminRequestRow }) {
  const badge = stateBadge[row.state];
  const code = [row.statusCode, row.errorCode, row.upstreamErrorCode].filter(Boolean).join(" · ");
  return (
    <>
      <Badge tone={badge.tone}>{badge.label}</Badge>
      {code && <span className={`${small} mt-1 font-mono`}>{code}</span>}
      {row.truncated && <span className={`${small} mt-1`}>{copy.truncated}</span>}
    </>
  );
}

function Row({ row }: { row: AdminRequestRow }) {
  const margin = marginMicros(row);
  return (
    <Tr>
      <Td className="py-2">
        <span className="block font-mono text-app-code whitespace-nowrap text-app-text-2 tabular-nums">{formatUtc(row.at)}</span>
        <span className={`${small} font-mono`}>{copy.idLabel} {row.id.slice(0, 8)}</span>
      </Td>
      <Td className="max-w-56 py-2">
        <span className="block truncate">{row.email ?? <span className="text-app-text-3">{copy.deletedUser}</span>}</span>
        {row.keyName && <span className={`${small} truncate`}>{row.keyName} · <span className="font-mono">{row.keyPrefix}…</span></span>}
      </Td>
      <Td className="py-2">
        <span className="block font-mono text-app-code">{row.modelId}</span>
        {(row.stream || row.upstreamFamily) && <span className={small}>{[row.stream && copy.stream, row.upstreamFamily].filter(Boolean).join(" · ")}</span>}
      </Td>
      <Td className="py-2"><Status row={row} /></Td>
      <Td align="right">{row.latencyMs === null ? dash : `${row.latencyMs.toLocaleString("en-US")} ms`}</Td>
      <Td align="right">{count(row.inputTokens)}</Td>
      <Td align="right">{count(row.outputTokens)}</Td>
      <Td align="right">{money(row.chargeMicros)}</Td>
      <Td align="right">{row.surplusCostMicros === null ? <span className="text-app-text-3">{copy.costWaiting}</span> : formatMicros(row.surplusCostMicros)}</Td>
      <Td align="right" className={margin !== null && margin < 0 ? "text-app-danger" : undefined}>
        {margin === null ? dash : formatSignedMicros(margin)}
      </Td>
    </Tr>
  );
}

/** Real rows from gateway_requests (PRD admin-requests-upstream §3); search, status and pending cost in the URL. */
export function RequestsView({ data, query }: { data: RequestsPage; query: Omit<RequestQuery, "page"> }) {
  const cols = copy.cols;
  const filtered = query.filter !== "all" || query.costPending || query.search !== null;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <RequestsToolbar query={query} />
      <Card title={copy.count(data.total)}>
        {data.rows.length === 0 ? (
          filtered
            ? <EmptyState icon={Search01Icon} title={copy.noMatch.title} body={copy.noMatch.body} />
            : <EmptyState icon={LinkSquare02Icon} title={copy.empty.title} body={copy.empty.body} />
        ) : (
          <Table minWidth="min-w-6xl">
            <THead>
              <Th>{cols.at}</Th>
              <Th>{cols.user}</Th>
              <Th>{cols.model}</Th>
              <Th>{cols.status}</Th>
              <Th align="right">{cols.latency}</Th>
              <Th align="right">{cols.input}</Th>
              <Th align="right">{cols.output}</Th>
              <Th align="right">{cols.charge}</Th>
              <Th align="right">{cols.cost}</Th>
              <Th align="right">{cols.margin}</Th>
            </THead>
            <tbody>{data.rows.map((r) => <Row key={r.id} row={r} />)}</tbody>
          </Table>
        )}
        <Pagination page={data.page} pages={data.pages} href={(page) => requestsHref(query, page)} labels={copy.pagination} />
        <p className="border-t border-app-border bg-app-inset px-6 py-3 text-app-small text-app-text-2">{copy.costNote}</p>
      </Card>
    </>
  );
}
