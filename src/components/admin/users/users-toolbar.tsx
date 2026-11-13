"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { secondaryAction } from "@/components/app-kit/button";
import { SearchInput } from "@/components/app-kit/field";
import { Segmented } from "@/components/app-kit/segmented";
import { USER_FILTERS, type UserFilter, usersHref } from "@/lib/admin-users/user-admin-contract";
import { filterLabels, usersCopy as copy } from "./users-copy";

const options = USER_FILTERS.map((value) => ({ value, label: filterLabels[value] }));

/**
 * Search (on Enter or the button) and status filter, both kept in the URL so the server renders the list. The push
 * runs in a transition so `pending` can show that the new list is loading (docs: guides/interactive-apps).
 */
export function UsersToolbar({ filter, search }: { filter: UserFilter; search: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState(search ?? "");
  const [pending, startTransition] = useTransition();
  const go = (nextFilter: UserFilter, text: string) =>
    startTransition(() => router.push(usersHref(nextFilter, text.trim() || null), { scroll: false }));

  function submit(event: FormEvent) {
    event.preventDefault();
    go(filter, query);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form role="search" onSubmit={submit} className="flex w-full gap-2 sm:max-w-sm">
        <SearchInput aria-label={copy.search} placeholder={copy.searchPlaceholder} value={query} wrapperClassName="flex-1"
          clearLabel={copy.clearSearch} onClear={() => { setQuery(""); go(filter, ""); }} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className={secondaryAction()}>
          {pending ? copy.searching : copy.searchSubmit}
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <span role="status" className="text-app-small text-app-text-2">{pending ? copy.loadingResults : ""}</span>
        <Segmented label={copy.filterLabel} options={options} value={filter} onChange={(next) => go(next, query)} />
      </div>
    </div>
  );
}
