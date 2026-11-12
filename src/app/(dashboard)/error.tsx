"use client"; // error boundaries must be Client Components (node_modules/next/dist/docs, file-conventions/error.md)

import { PageError } from "@/components/app-kit/page-error";
import { shellCopy } from "@/components/dashboard/shell/shell-copy";

// Wraps every dashboard page, not this group's layout: sidebar and header stay while one page fails.
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  return <PageError error={error} retry={retry} home="/quick-start" copy={shellCopy.pageError} />;
}
