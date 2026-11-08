import type { Metadata } from "next";
import { SettingsView } from "@/components/dashboard/settings/settings-view";

export const metadata: Metadata = { title: "Account Settings" };

export default function Page() {
  return <SettingsView />;
}
