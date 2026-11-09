import type { Metadata } from "next";
import { UsersView } from "@/components/admin/users/users-view";

export const metadata: Metadata = { title: "Pengguna · Admin" };

export default function Page() {
  return <UsersView />;
}
