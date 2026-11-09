import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/settings/settings-view";

export const metadata: Metadata = { title: "Pengaturan · Admin" };

export default function Page() {
  return <SettingsView />;
}
