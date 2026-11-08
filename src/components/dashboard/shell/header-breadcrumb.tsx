"use client";

import { usePathname } from "next/navigation";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { activeItem } from "./nav-items";
import { shellCopy } from "./shell-copy";

/** "Team / Page" from the current route, so the header always says where you are. */
export function HeaderBreadcrumb() {
  const page = activeItem(usePathname());
  return (
    <nav aria-label={shellCopy.breadcrumb} className="min-w-0">
      <ol className="flex items-center gap-2 text-sm">
        <li className="hidden truncate text-muted-foreground sm:block">{account.name}</li>
        {page && (
          <>
            <li aria-hidden className="hidden text-faint sm:block">/</li>
            <li aria-current="page" className="truncate font-medium">{page.label}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
