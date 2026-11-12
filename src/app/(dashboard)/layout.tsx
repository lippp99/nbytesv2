import { type ReactNode, Suspense } from "react";
import { AppFooter } from "@/components/dashboard/shell/app-footer";
import { AppHeader } from "@/components/dashboard/shell/app-header";
import { MaintenanceBanner } from "@/components/dashboard/shell/maintenance-banner";
import { Sidebar } from "@/components/dashboard/shell/sidebar/sidebar";
import { WalletMenu, WalletMenuSkeleton } from "@/components/dashboard/shell/wallet-menu";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { readSession } from "@/lib/server/auth/session";
import { countActiveApiKeys } from "@/lib/server/gateway/api-keys";
import { countActiveModels } from "@/lib/server/gateway/catalog";
import { currentDepositRules } from "@/lib/server/payments/deposit-rules";
import { currentPlatformSettings } from "@/lib/server/platform/settings";
import { currentExchangeRate } from "@/lib/server/payments/exchange-rate";
import { userBalance } from "@/lib/server/payments/user-billing";

// Folds from 256px to a 64px rail on desktop (`rail:` variant); z-40 keeps the rail tooltips above page content.
const sidebar =
  "sticky top-0 z-40 hidden h-dvh w-64 shrink-0 border-r border-app-border transition-[width] duration-200 ease-out " +
  "motion-reduce:transition-none lg:block rail:w-16";

/** Database session check (the proxy only sees the cookie): no valid session -> /login. Renders nothing. */
async function SessionGate() {
  await getCurrentUser();
  return null;
}

/** The signed-in user's available balance in the header; nothing without a session (SessionGate redirects). */
async function Wallet() {
  const session = await readSession();
  if (!session) return null;
  const [{ balanceMicros, heldMicros }, rate, rules] = await Promise.all([
    userBalance(session.user.id), currentExchangeRate(), currentDepositRules(),
  ]);
  return <WalletMenu availableMicros={balanceMicros - heldMicros} heldMicros={heldMicros} rate={rate} minIdr={rules.minIdr} />;
}

/** The admin's maintenance text on every page while maintenance is on; nothing otherwise. */
async function Maintenance() {
  const { maintenance, banner } = await currentPlatformSettings();
  return maintenance ? <MaintenanceBanner text={banner} /> : null;
}

/** Active key count beside "API Keys" in the sidebar; nothing without a session (SessionGate redirects). */
async function KeyCount() {
  const session = await readSession();
  return session ? countActiveApiKeys(session.user.id) : null;
}

/** Active model count beside "Models"; same for every user, shown only with a session like the rest of the frame. */
async function ModelCount() {
  return (await readSession()) ? countActiveModels() : null;
}

// Route group: the dashboard pages share this frame but keep short URLs (/playground, not /dashboard/playground).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const counts = {
    "/api-keys": <Suspense fallback={null}><KeyCount /></Suspense>,
    "/models": <Suspense fallback={null}><ModelCount /></Suspense>,
  };
  return (
    // data-app switches on the dashboard tokens in globals.css (html:has([data-app])); the landing never has it.
    <div data-app className="flex min-h-dvh flex-1 bg-app-page text-app-text">
      <Suspense fallback={null}>
        <SessionGate />
      </Suspense>
      <aside id="app-sidebar" className={sidebar}>
        <Sidebar counts={counts} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Reading the session must sit behind <Suspense> with Cache Components. */}
        <AppHeader wallet={<Suspense fallback={<WalletMenuSkeleton />}><Wallet /></Suspense>} counts={counts} />
        <Suspense fallback={null}><Maintenance /></Suspense>
        <main className="flex-1 px-5 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-app">{children}</div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
