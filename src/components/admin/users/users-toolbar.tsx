"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { secondaryAction } from "@/components/app-kit/button";
import { TextInput } from "@/components/app-kit/field";
import { Segmented } from "@/components/app-kit/segmented";
import { USER_FILTERS, type UserFilter, usersHref } from "@/lib/admin-users/user-admin-contract";
import { filterLabels, usersCopy as copy } from "./users-copy";

const options = USER_FILTERS.map((value) => ({ value, label: filterLabels[value] }));

/** Search (on Enter or the button) and status filter, both kept in the URL so the server renders the list. */
export function UsersToolbar({ filter, search }: { filter: UserFilter; search: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState(search ?? "");
  const go = (nextFilter: UserFilter, text: string) => router.push(usersHref(nextFilter, text.trim() || null), { scroll: false });

  function submit(event: FormEvent) {
    event.preventDefault();
    go(filter, query);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form role="search" onSubmit={submit} className="flex w-full gap-2 sm:max-w-sm">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-text-3" />
          <TextInput type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder} value={query} className="pl-9"
            onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button type="submit" className={secondaryAction()}>{copy.searchSubmit}</button>
      </form>
      <Segmented label={copy.filterLabel} options={options} value={filter} onChange={(next) => go(next, query)} />
    </div>
  );
}
