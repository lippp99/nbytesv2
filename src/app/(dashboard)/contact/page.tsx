import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactSkeleton, ContactView } from "@/components/dashboard/contact/contact-view";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { visibleContacts } from "@/lib/server/support/contacts";

export const metadata: Metadata = { title: "Kontak admin" };

/** Reads the session itself (layouts do not re-run on navigation); only switched-on channels reach the page. */
async function Contact() {
  await getCurrentUser();
  return <ContactView contacts={await visibleContacts()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ContactSkeleton />}>
      <Contact />
    </Suspense>
  );
}
