import type { ReactNode } from "react";
import Link from "next/link";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import type { Profile } from "@/lib/auth/auth-contract";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { ProfileForm } from "./profile-form";
import { settings as copy } from "./settings-copy";

/** Settings row: what the section is about on the left, its controls in a card on the right. */
function Section({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-app-border py-8 first:border-t-0 first:pt-0 lg:grid-cols-3 lg:gap-10">
      <div>
        <h2 className="text-app-card text-app-text">{title}</h2>
        <p className="mt-1 text-app-ui text-app-text-2">{body}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </section>
  );
}

/** Only what the page shows, never the session or the user id (docs data-security: narrow DTO). */
export function SettingsView({ profile, email }: { profile: Profile; email: string }) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Section title={copy.profile.title} body={copy.profile.body}>
        <ProfileForm profile={profile} email={email} />
      </Section>
      <Section title={copy.security.title} body={copy.security.body}>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-app-ui text-app-text-2">{copy.sessionsNote}</p>
            <Link href="/sessions" className={secondaryAction()}>{copy.sessionsLink}</Link>
          </div>
        </Card>
      </Section>
      <Section title={copy.danger.title} body={copy.danger.body}>
        <Card className="border-app-danger/40">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-app-ui text-app-text-2">{copy.deleteNote}</p>
            <DeleteAccountDialog email={email} />
          </div>
        </Card>
      </Section>
    </>
  );
}
