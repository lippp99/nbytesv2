"use client";

import { useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { focusRing } from "@/components/button-styles";
import { cn } from "@/lib/utils";
import { models as copy } from "./landing-copy";
import { type Capability, capabilityLabels, type Model, mockModels, providerById } from "@/lib/model-catalog";
import { ModelRow } from "./model-row";

const PREVIEW = 6; // rows shown before "show all"; a search or filter always lists every match
const capabilities = (Object.keys(capabilityLabels) as Capability[]).filter((c) => c !== "streaming");
const countFor = (cap: Capability) => mockModels.filter((m) => m.capabilities.includes(cap)).length;

function matches(model: Model, query: string, cap: Capability | null) {
  if (cap && !model.capabilities.includes(cap)) return false;
  const q = query.toLowerCase().replace(/\s+/g, " ").trim();
  if (!q) return true;
  const caps = model.capabilities.map((c) => capabilityLabels[c]);
  return [model.name, model.id, providerById(model.providerId)?.name, ...caps].join(" ").toLowerCase().includes(q);
}

// Search bar, capability counts and rows, laid out like jatevo.ai's model library (.lib-bar, .caps, .mrow).
export function ModelLibrary() {
  const [query, setQuery] = useState("");
  const [cap, setCap] = useState<Capability | null>(null);
  const [expanded, setExpanded] = useState(false);
  const rows = mockModels.filter((m) => matches(m, query, cap));
  const filtering = query.trim() !== "" || cap !== null;
  const shown = expanded || filtering ? rows : rows.slice(0, PREVIEW);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-y border-dashed border-guide py-3">
        <label className="flex max-w-130 flex-1 basis-70 items-center gap-2.5">
          <SearchIcon aria-hidden className="size-3.5 shrink-0 text-accent-ink" />
          <span className="sr-only">{copy.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder={copy.search}
            className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          <b className="font-medium text-foreground">{rows.length}</b> {copy.count}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-guide py-3.5">
        <span className="text-xs text-muted-foreground">{copy.capsLabel}</span>
        {capabilities.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cap === c}
            onClick={() => setCap(cap === c ? null : c)}
            className={cn(
              "text-xs font-medium text-foreground/80 underline-offset-4 transition-colors duration-150 hover:text-foreground",
              "aria-pressed:text-foreground aria-pressed:underline aria-pressed:decoration-accent-strong aria-pressed:decoration-2",
              focusRing,
            )}
          >
            {capabilityLabels[c]} <span className="ml-1 font-normal text-muted-foreground">{countFor(c)}</span>
          </button>
        ))}
      </div>
      <ul>
        {shown.map((m) => (
          <ModelRow key={m.id} model={m} />
        ))}
      </ul>
      {!filtering && rows.length > PREVIEW && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "group mt-4 inline-flex h-9 items-center gap-1.5 text-ui font-medium text-foreground/80 transition-colors hover:text-foreground",
            focusRing,
          )}
        >
          {expanded ? copy.showLess : copy.showAll(rows.length)}
          <ChevronDownIcon aria-hidden className="size-3.5 transition-transform duration-300 ease-out-expo group-aria-expanded:rotate-180" />
        </button>
      )}
      {rows.length === 0 && <p className="border-b border-dashed border-guide py-6.5 text-muted-foreground">{copy.empty}</p>}
    </div>
  );
}
