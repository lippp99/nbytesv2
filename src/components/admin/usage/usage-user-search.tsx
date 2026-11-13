"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { secondaryAction } from "@/components/app-kit/button";
import { SearchInput } from "@/components/app-kit/field";
import { type UsageFilters, usageHref } from "@/lib/admin-gateway/usage-contract";
import { usageCopy } from "./usage-copy";

const copy = usageCopy.users;

/** Email search of the per-user table (on Enter or the button); month and sort stay as they are. */
export function UsageUserSearch({ query, currentMonth }: { query: UsageFilters; currentMonth: string }) {
  const router = useRouter();
  const [text, setText] = useState(query.search ?? "");
  const [pending, startTransition] = useTransition();

  const go = (search: string | null) =>
    startTransition(() => router.push(usageHref({ ...query, search }, currentMonth), { scroll: false }));

  function submit(event: FormEvent) {
    event.preventDefault();
    go(text.trim() || null);
  }

  return (
    <form role="search" onSubmit={submit} className="flex w-full gap-2 sm:w-80">
      <SearchInput aria-label={copy.search} placeholder={copy.searchPlaceholder} value={text} wrapperClassName="flex-1"
        clearLabel={copy.clearSearch} onClear={() => { setText(""); go(null); }} onChange={(e) => setText(e.target.value)} />
      <button type="submit" disabled={pending} aria-busy={pending || undefined} className={secondaryAction()}>
        {pending ? copy.searching : copy.searchSubmit}
      </button>
    </form>
  );
}
