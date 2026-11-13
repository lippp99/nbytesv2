import { Medal1Icon } from "@/components/admin/shared/icons/medal-1";
import { Medal2Icon } from "@/components/admin/shared/icons/medal-2";
import { Medal3Icon } from "@/components/admin/shared/icons/medal-3";
import { leaderboardCopy } from "./leaderboard-copy";

// Ranks 1-3 get the owner's medal icon (medal.html) in its own colour (measured tokens, see dashboard-design.md); the
// rank is always written too, so colour is never the only sign. Ties share a rank, so two rows can carry the same medal.
const medals = [
  { Icon: Medal1Icon, className: "text-app-medal-gold" },
  { Icon: Medal2Icon, className: "text-app-medal-silver" },
  { Icon: Medal3Icon, className: "text-app-medal-bronze" },
];

export function RankMark({ rank }: { rank: number }) {
  const medal = medals[rank - 1];
  return (
    <span className="flex items-center gap-2">
      {medal ? <medal.Icon className={`size-5 shrink-0 ${medal.className}`} /> : <span className="size-5 shrink-0" />}
      <span className="font-mono text-app-code text-app-text-2 tabular-nums">
        <span className="sr-only">{leaderboardCopy.cols.rank} </span>{rank}
      </span>
    </span>
  );
}
