"use client";

import { usePathname } from "next/navigation";
import { activeItem } from "./nav-items";
import { shellCopy } from "./shell-copy";

/** The current page's name, so the header always says where you are. */
export function HeaderBreadcrumb() {
  const page = activeItem(usePathname());
  return (
    <nav aria-label={shellCopy.breadcrumb} className="min-w-0">
      <ol className="flex items-center gap-1.5 text-app-ui">
        {page && <li aria-current="page" className="truncate font-medium text-app-text">{page.label}</li>}
      </ol>
    </nav>
  );
}
