"use client";

import { usePathname } from "next/navigation";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { ArrowRightIcon } from "@/components/icons/ui/arrow-right";
import { activeItem } from "./nav-items";
import { shellCopy } from "./shell-copy";

/** "Team > Page" from the current route, so the header always says where you are. */
export function HeaderBreadcrumb() {
  const page = activeItem(usePathname());
  return (
    <nav aria-label={shellCopy.breadcrumb} className="min-w-0">
      <ol className="flex items-center gap-1.5 text-app-ui">
        <li className="hidden truncate text-app-text-3 sm:block">{account.name}</li>
        {page && (
          <>
            <li aria-hidden className="hidden text-app-text-3 sm:block">
              <ArrowRightIcon className="size-3.5" />
            </li>
            <li aria-current="page" className="truncate font-medium text-app-text">{page.label}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
