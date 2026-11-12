"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { secondaryAction } from "@/components/app-kit/button";
import { TextInput } from "@/components/app-kit/field";
import { Segmented } from "@/components/app-kit/segmented";
import { REQUEST_FILTERS, type RequestQuery, requestsHref } from "@/lib/admin-gateway/request-log-contract";
import { filterLabels, requestsCopy as copy } from "./requests-copy";

const options = REQUEST_FILTERS.map((value) => ({ value, label: filterLabels[value] }));
type Query = Omit<RequestQuery, "page">;

/** Search, status and the pending-cost switch, all kept in the URL so the server renders the list (page 1 again). */
export function RequestsToolbar({ query }: { query: Query }) {
  const router = useRouter();
  const [text, setText] = useState(query.search ?? "");
  const go = (next: Query) => router.push(requestsHref(next), { scroll: false });

  function submit(event: FormEvent) {
    event.preventDefault();
    go({ ...query, search: text.trim() || null });
  }

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <form role="search" onSubmit={submit} className="flex w-full gap-2 lg:max-w-md">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-text-3" />
          <TextInput type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder} value={text} className="pl-9"
            onChange={(e) => setText(e.target.value)} />
        </div>
        <button type="submit" className={secondaryAction()}>{copy.searchSubmit}</button>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label={copy.filterLabel} options={options} value={query.filter} className="flex-wrap"
          onChange={(filter) => go({ ...query, filter })} />
        <label className="flex items-center gap-2 text-app-small text-app-text-2">
          <input type="checkbox" checked={query.costPending} className="size-4 accent-app-accent"
            onChange={(e) => go({ ...query, costPending: e.target.checked })} />
          {copy.costPending}
        </label>
      </div>
    </div>
  );
}
