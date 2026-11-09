import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsSkeleton } from "@/components/dashboard/settings/settings-skeleton";
import { SettingsView } from "@/components/dashboard/settings/settings-view";
import { readSession } from "@/lib/server/auth/session";

export const metadata: Metadata = { title: "Account Settings" };

/** Reads the session itself (layouts do not re-run on navigation) and passes only what the page shows. */
async function Settings() {
  const session = await readSession();
  if (!session) redirect("/login?next=%2Fsettings");
  const { email, firstName, lastName } = session.user;
  // Accounts from before the register tab have no first name yet: the form starts empty.
  return <SettingsView profile={{ firstName: firstName ?? "", lastName }} email={email} />;
}

export default function Page() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Settings />
    </Suspense>
  );
}
