import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { PageHeader } from "@/components/app-kit/page-header";
import type { ContactSettings } from "@/lib/support/contact-contract";
import { contactCopy as copy } from "./contact-copy";
import { ContactForm } from "./contact-form";

/** The admin Contact page: header and the channel form, filled from the database. */
export function ContactView({ contacts }: { contacts: ContactSettings }) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <ContactForm initial={contacts} />
    </>
  );
}

export function ContactSkeleton() {
  return <ListSkeleton title={copy.title} sub={copy.sub} label={copy.loading} rows={3} />;
}
