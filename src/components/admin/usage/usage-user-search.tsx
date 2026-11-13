"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { secondaryAction } from "@/components/app-kit/button";
import { TextInput } from "@/components/app-kit/field";
import { type UsageFilters, usageHref } from "@/lib/admin-gateway/usage-contract";
import { usageCopy } from "./usage-copy";

const copy = usageCopy.users;

/** Email search of the per-user table (on Enter or the button); month and sort stay as they are. */
export function UsageUserSearch({ query, currentMonth }: { query: UsageFilters; currentMonth: string }) {
  const router = useRouter();
  const [text, setText] = useState(query.search ?? "");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...query, search: text.trim() || null };
    startTransition(() => router.push(usageHref(next, currentMonth), { scroll: false }));
  }

  return (
    <form role="search" onSubmit={submit} className="flex w-full gap-2 sm:w-80">
      <div className="relative flex-1">
        <HugeiconsIcon icon={Search01Icon} aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-text-3" />
        <TextInput type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder} value={text} className="pl-9"
          onChange={(e) => setText(e.target.value)} />
      </div>
      <button type="submit" disabled={pending} aria-busy={pending || undefined} className={secondaryAction()}>
        {pending ? copy.searching : copy.searchSubmit}
      </button>
    </form>
  );
}
