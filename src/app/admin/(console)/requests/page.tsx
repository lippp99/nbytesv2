import type { Metadata } from "next";
import { RequestsView } from "@/components/admin/requests/requests-view";

export const metadata: Metadata = { title: "Request log · Admin" };

export default function Page() {
  return <RequestsView />;
}
