import type { Metadata } from "next";
import { loginCopy } from "@/components/admin/login/login-copy";
import { LoginView } from "@/components/admin/login/login-view";

export const metadata: Metadata = { title: loginCopy.pageTitle, robots: { index: false } };

export default function Page() {
  return <LoginView />;
}
