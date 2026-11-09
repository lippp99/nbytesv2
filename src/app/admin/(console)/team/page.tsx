import type { Metadata } from "next";
import { TeamView } from "@/components/admin/team/team-view";

export const metadata: Metadata = { title: "Admin & akses · Admin" };

export default function Page() {
  return <TeamView />;
}
