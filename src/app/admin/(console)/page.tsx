import type { Metadata } from "next";
import { Suspense } from "react";
import { overviewCopy as copy } from "@/components/admin/overview/overview-copy";
import { OverviewFigures } from "@/components/admin/overview/overview-figures";
import { OverviewAlerts, OverviewMoney } from "@/components/admin/overview/overview-money";
import { OverviewSkeleton } from "@/components/admin/overview/overview-skeleton";
import { OverviewTop, OverviewTrends } from "@/components/admin/overview/overview-trends";
import { PageHeader } from "@/components/app-kit/page-header";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";
import { overviewAlerts } from "@/lib/server/admin-overview/alerts";
import { dayFigures, moneyHealth, monthFigures, userFigures } from "@/lib/server/admin-overview/figures";
import { topModels, topUsers, trend } from "@/lib/server/admin-overview/trends";

export const metadata: Metadata = { title: "Ringkasan · Admin" };

// PRD admin-overview: each section streams on its own, so a slow Surplus answer never holds back database figures.
// Every section checks the admin session next to its data (the layout gate does not keep output out of the response).

async function Figures() {
  await getCurrentAdmin();
  const now = new Date();
  const [month, day, users] = await Promise.all([monthFigures(now), dayFigures(now), userFigures(now)]);
  return <OverviewFigures month={month} day={day} users={users} />;
}

async function MoneyAndAlerts() {
  await getCurrentAdmin();
  const now = new Date();
  const money = await moneyHealth(now);
  const alerts = await overviewAlerts(now, money);
  return (
    <>
      <OverviewAlerts alerts={alerts} />
      <OverviewMoney money={money} />
    </>
  );
}

async function Trends() {
  await getCurrentAdmin();
  const now = new Date();
  const [days, models, users] = await Promise.all([trend(now), topModels(now), topUsers(now)]);
  return (
    <>
      <OverviewTrends days={days} />
      <OverviewTop models={models} users={users} />
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-10">
        <Suspense fallback={<OverviewSkeleton rows={4} />}><Figures /></Suspense>
        <Suspense fallback={<OverviewSkeleton rows={6} />}><MoneyAndAlerts /></Suspense>
        <Suspense fallback={<OverviewSkeleton rows={8} />}><Trends /></Suspense>
      </div>
    </>
  );
}
