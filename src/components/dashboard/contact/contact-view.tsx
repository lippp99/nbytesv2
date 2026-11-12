import { CustomerSupportIcon, Mail01Icon, TelegramIcon, WhatsappIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { PageHeader } from "@/components/app-kit/page-header";
import type { ContactChannel, VisibleContact } from "@/lib/support/contact-contract";
import { contactCopy as copy } from "./contact-copy";

const icons: Record<ContactChannel, IconSvgElement> = { whatsapp: WhatsappIcon, telegram: TelegramIcon, email: Mail01Icon };

/** One channel: what it is, the number / username / address to read, and the button that opens it. */
function ContactRow({ contact }: { contact: VisibleContact }) {
  const { label, open } = copy.channels[contact.channel];
  const external = contact.channel !== "email"; // wa.me and t.me open in a new tab; mailto opens the mail app
  return (
    <li className="flex flex-wrap items-center gap-4 px-6 py-4">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-app-control bg-app-inset text-app-text-2">
        <HugeiconsIcon icon={icons[contact.channel]} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-app-ui font-medium text-app-text">{label}</span>
        <span className="block font-mono text-app-code break-all text-app-text-2">
          {contact.channel === "telegram" ? `@${contact.value}` : contact.channel === "whatsapp" ? `+${contact.value}` : contact.value}
        </span>
      </span>
      <a href={contact.href} className={secondaryAction()} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
        {open}
        {external && <span className="sr-only"> {copy.newTab}</span>}
      </a>
    </li>
  );
}

/** The admin's switched-on channels (admin Contact page); an empty state while none is on. */
export function ContactView({ contacts }: { contacts: VisibleContact[] }) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card>
        {contacts.length > 0 ? (
          <ul className="divide-y divide-app-border">
            {contacts.map((c) => <ContactRow key={c.channel} contact={c} />)}
          </ul>
        ) : (
          <EmptyState icon={CustomerSupportIcon} title={copy.empty.title} body={copy.empty.body} />
        )}
      </Card>
    </>
  );
}

export function ContactSkeleton() {
  return <ListSkeleton title={copy.title} sub={copy.sub} label={copy.loading} rows={3} />;
}
