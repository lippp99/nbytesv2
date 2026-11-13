import { PodiumIcon } from "@/components/admin/shared/icons/podium";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { monthName, percent, periodName } from "@/components/admin/shared/report-format";
import { LEADERBOARD_SIZE, type Leaderboard } from "@/lib/admin-gateway/leaderboard-contract";
import { shareBp } from "@/lib/admin-gateway/usage-contract";
import { leaderboardCopy as copy } from "./leaderboard-copy";
import { ModelsBoard, UsersBoard } from "./leaderboard-tables";
import { LeaderboardToolbar } from "./leaderboard-toolbar";

type LeaderboardViewProps = { data: Leaderboard; currentMonth: string; today: string };

/** The top accounts and the top models of one period by tokens, with medals for the first three. */
export function LeaderboardView({ data, currentMonth, today }: LeaderboardViewProps) {
  const months = data.months.map((value) => ({ value, label: monthName(value) }));
  const name = periodName(data.period);
  const topTokens = data.users.reduce((sum, u) => sum + u.tokens, 0);
  const topShare = copy.users.share(LEADERBOARD_SIZE, percent(shareBp(topTokens, data.totalTokens) ?? 0));
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      {/* keyed on the period kind, so going back in history resets a kind picked but not yet applied */}
      <LeaderboardToolbar key={data.period.kind} period={data.period} currentMonth={currentMonth} today={today}
        months={months} years={data.years} />
      {data.totalTokens === 0 ? (
        <Card><EmptyState icon={PodiumIcon} title={copy.empty.title(name)} body={copy.empty.body} /></Card>
      ) : (
        <div className="space-y-10">
          <Card title={copy.users.title(LEADERBOARD_SIZE)} description={`${copy.users.description} ${topShare}`}>
            {data.users.length === 0
              ? <p className="px-6 py-8 text-app-ui text-app-text-2">{copy.users.empty}</p>
              : <UsersBoard rows={data.users} total={data.totalTokens} period={data.period} currentMonth={currentMonth} />}
          </Card>
          <Card title={copy.models.title(LEADERBOARD_SIZE)} description={copy.models.description}>
            <ModelsBoard rows={data.models} total={data.totalTokens} />
          </Card>
          <p className="text-app-small text-app-text-3">{copy.note}</p>
        </div>
      )}
    </>
  );
}
