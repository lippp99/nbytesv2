import Link from "next/link";
import { appFocus } from "@/components/app-kit/button";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { count, percent } from "@/components/admin/shared/report-format";
import { ProviderLogo } from "@/components/provider-logo";
import type { Favourite, LeaderModel, LeaderUser } from "@/lib/admin-gateway/leaderboard-contract";
import { requestsHref } from "@/lib/admin-gateway/request-log-contract";
import { type UsagePeriod, shareBp, usageHref } from "@/lib/admin-gateway/usage-contract";
import { modelLogo } from "@/lib/model-logo";
import { cn } from "@/lib/utils";
import { leaderboardCopy as copy } from "./leaderboard-copy";
import { RankMark } from "./rank-mark";

const c = copy.cols;
const link = cn("rounded-app-inner text-app-accent-text underline-offset-4 hover:underline", appFocus);

/** Share of all tokens of the period as a number and a thin bar (the number carries the meaning, the bar the shape). */
function ShareCell({ tokens, total }: { tokens: number; total: number }) {
  const bp = shareBp(tokens, total) ?? 0;
  return (
    <Td align="right">
      <span className="flex items-center justify-end gap-3">
        <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-app-inset">
          <span className="block h-full rounded-full bg-app-chart-2" style={{ width: `${bp / 100}%` }} />
        </span>
        <span className="w-14">{percent(bp)}</span>
      </span>
    </Td>
  );
}

/** The account's model with the most tokens: catalog name, or the model id when it is not in the catalog. */
function FavouriteCell({ value }: { value: Favourite }) {
  if (!value) return <Td className="text-app-text-3">{copy.none}</Td>;
  return (
    <Td className="max-w-56">
      <span className="block truncate font-mono text-app-code text-app-text">{value.label}</span>
      <span className="block text-app-small text-app-text-3">{copy.favouriteNote(count(value.tokens))}</span>
    </Td>
  );
}

type UsersProps = { rows: LeaderUser[]; total: number; period: UsagePeriod; currentMonth: string };

export function UsersBoard({ rows, total, period, currentMonth }: UsersProps) {
  return (
    <Table minWidth="min-w-5xl">
      <THead>
        <Th>{c.rank}</Th><Th>{c.user}</Th><Th align="right">{c.tokens}</Th><Th align="right">{c.share}</Th>
        <Th align="right">{c.requests}</Th><Th align="right">{c.models}</Th><Th>{c.favouriteModel}</Th>
      </THead>
      <tbody>
        {rows.map((u) => {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
          const href = usageHref({ period, sort: "tokens", search: u.email }, currentMonth);
          return (
            <Tr key={u.userId}>
              <Td className="w-28"><RankMark rank={u.rank} /></Td>
              <Td className="max-w-72">
                {name && <span className="block truncate text-app-text">{name}</span>}
                <Link href={href} className={cn(link, "block truncate", name && "text-app-small")}>{u.email}</Link>
              </Td>
              <Td align="right" className="text-app-text">{count(u.tokens)}</Td>
              <ShareCell tokens={u.tokens} total={total} />
              <Td align="right">{count(u.requests)}</Td>
              <Td align="right">{count(u.models)}</Td>
              <FavouriteCell value={u.topModel} />
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export function ModelsBoard({ rows, total }: { rows: LeaderModel[]; total: number }) {
  return (
    <Table minWidth="min-w-5xl">
      <THead>
        <Th>{c.rank}</Th><Th>{c.model}</Th><Th align="right">{c.tokens}</Th><Th align="right">{c.share}</Th>
        <Th align="right">{c.requests}</Th>
      </THead>
      <tbody>
        {rows.map((m) => {
          const logo = modelLogo(m.modelId, m.name);
          const href = requestsHref({ filter: "all", costPending: false, search: m.modelId });
          return (
            <Tr key={m.modelId}>
              <Td className="w-28"><RankMark rank={m.rank} /></Td>
              <Td className="max-w-80">
                <span className="flex items-center gap-3">
                  {logo ? <ProviderLogo icon={logo} className="text-app-text" /> : <span aria-hidden className="size-5 shrink-0" />}
                  <span className="min-w-0">
                    {m.name && <span className="block truncate text-app-text">{m.name}</span>}
                    <Link href={href} className={cn(link, "block truncate font-mono text-app-code", m.name && "text-app-small")}>
                      {m.modelId}
                    </Link>
                  </span>
                </span>
              </Td>
              <Td align="right" className="text-app-text">{count(m.tokens)}</Td>
              <ShareCell tokens={m.tokens} total={total} />
              <Td align="right">{count(m.requests)}</Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
