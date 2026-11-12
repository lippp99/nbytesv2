import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactSkeleton, ContactView } from "@/components/admin/contact/contact-view";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";
import { contactSettings } from "@/lib/server/support/contacts";

export const metadata: Metadata = { title: "Kontak · Admin" };

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Contact() {
  await getCurrentAdmin();
  return <ContactView contacts={await contactSettings()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ContactSkeleton />}>
      <Contact />
    </Suspense>
  );
}
