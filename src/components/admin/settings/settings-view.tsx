import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { PageHeader } from "@/components/app-kit/page-header";
import type { PlatformSettings } from "@/lib/platform/platform-settings-contract";
import { settingsCopy as copy } from "./settings-copy";
import { SettingsForm } from "./settings-form";

/** The admin platform settings page, filled with the settings in force (database, or the defaults before a save). */
export function SettingsView({ settings }: { settings: PlatformSettings }) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <SettingsForm initial={settings} />
    </>
  );
}

export function SettingsSkeleton() {
  return <ListSkeleton title={copy.title} sub={copy.sub} label={copy.loading} rows={5} />;
}
