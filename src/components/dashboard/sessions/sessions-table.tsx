import { useSyncExternalStore } from "react";
import { secondaryAction } from "@/components/app-kit/button";
import { Badge } from "@/components/app-kit/badge";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import type { ActiveSession } from "@/lib/auth/auth-contract";
import { sessionsCopy as copy } from "./sessions-copy";

// Local time of the viewer: the server does not know the time zone, so dates render only after hydration.
const timeLabel = new Intl.DateTimeFormat("id-ID", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const noop = () => () => {};
const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);

function When({ iso }: { iso: string }) {
  const client = useIsClient();
  return <time dateTime={iso} className="tabular-nums">{client ? timeLabel.format(new Date(iso)) : " "}</time>;
}

// 3:2 flag with a hairline ring, so white bands (Indonesia, Japan) stay visible on the white card.
const flagBox = "inline-block h-4 w-6 shrink-0 overflow-hidden rounded-xs ring-1 ring-app-border [&>svg]:size-full";

/** Flag (country name only for screen readers and the tooltip), then the masked IP in mono. */
function Location({ session }: { session: ActiveSession }) {
  const { flagSvg, location, ip } = session;
  if (!flagSvg && !location && !ip) return <span className="text-app-text-3">{copy.unknownLocation}</span>;
  return (
    <span className="inline-flex items-center gap-2">
      {flagSvg ? (
        // Static SVG from the pinned country-flag-icons package, rendered on our server; no user input inside.
        <span role="img" aria-label={location ?? undefined} title={location ?? undefined} className={flagBox}
          dangerouslySetInnerHTML={{ __html: flagSvg }} />
      ) : (
        location && <span>{location}</span>
      )}
      {ip && <span className="font-mono text-app-code text-app-text-3">{ip}</span>}
    </span>
  );
}

function LastSeen({ session }: { session: ActiveSession }) {
  return session.current ? <Badge className="whitespace-nowrap">{copy.thisDevice}</Badge> : <When iso={session.lastSeenAt} />;
}

type SessionsTableProps = { sessions: ActiveSession[]; busyId: string | null; locked: boolean; onRevoke: (id: string) => void };

/**
 * Device, location, sign-in time and last activity. Same columns on every screen: below the minimum width the table
 * scrolls sideways inside the card (owner's choice for mobile, 2026-11-09) instead of stacking.
 */
export function SessionsTable({ sessions, busyId, locked, onRevoke }: SessionsTableProps) {
  return (
    <Table minWidth="min-w-2xl">
      {/* Header band on app-inset: a gray well inside the card in both themes (text-3 on inset >= 4.83:1). */}
      <THead>
        <Th>{copy.cols.device}</Th>
        <Th>{copy.cols.location}</Th>
        <Th>{copy.cols.lastSeen}</Th>
        <Th align="right"><span className="sr-only">{copy.cols.actions}</span></Th>
      </THead>
      <tbody>
        {sessions.map((session) => (
          <Tr key={session.id}>
            <Td className="py-3">
              <span className="block whitespace-nowrap font-medium text-app-text">{session.device}</span>
              <span className="mt-0.5 block whitespace-nowrap text-app-small text-app-text-3">
                {copy.signedIn} <When iso={session.signedInAt} />
              </span>
            </Td>
            <Td className="whitespace-nowrap text-app-text-2"><Location session={session} /></Td>
            <Td className="whitespace-nowrap text-app-text-2"><LastSeen session={session} /></Td>
            <Td className="text-right">
              {!session.current && (
                <button type="button" onClick={() => onRevoke(session.id)} disabled={locked}
                  aria-busy={busyId === session.id || undefined} aria-label={copy.signOutLabel(session.device)}
                  className={secondaryAction("", "sm")}>
                  {busyId === session.id ? copy.signingOut : copy.signOut}
                </button>
              )}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
