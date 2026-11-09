import type { Metadata } from "next";
import { AuditView } from "@/components/admin/audit/audit-view";

export const metadata: Metadata = { title: "Audit log · Admin" };

export default function Page() {
  return <AuditView />;
}
