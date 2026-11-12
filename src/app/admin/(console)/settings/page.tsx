import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsSkeleton, SettingsView } from "@/components/admin/settings/settings-view";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";
import { currentPlatformSettings } from "@/lib/server/platform/settings";

export const metadata: Metadata = { title: "Pengaturan · Admin" };

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Settings() {
  await getCurrentAdmin();
  return <SettingsView settings={await currentPlatformSettings()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Settings />
    </Suspense>
  );
}
