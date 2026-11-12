"use client"; // error boundaries must be Client Components (node_modules/next/dist/docs, file-conventions/error.md)

import { PageError } from "@/components/app-kit/page-error";
import { shellCopy } from "@/components/admin/shell/shell-copy";

// Wraps every console page, not the console layout: the admin sidebar and header stay while one page fails.
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  return <PageError error={error} retry={retry} home="/admin" copy={shellCopy.pageError} />;
}
