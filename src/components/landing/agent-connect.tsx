"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { focusRing } from "@/components/button-styles";
import { ProviderLogo } from "@/components/provider-logo";
import { cn } from "@/lib/utils";
import { HubWires } from "./hub-wires";
import { responsesOnly, setupText, setups, speaksResponses, tools } from "./agents-data";
import { agents as copy } from "./landing-copy";
import { type Model, mockModels } from "@/lib/model-catalog";
import { SetupBody } from "./setup-body";

const pickable = mockModels.slice(0, 9);
// phones: one sideways-scrolling row edge to edge (jatevo .pick under 640px); wraps from 640px up
const chipRow = "-mx-4 flex items-center gap-2 overflow-x-auto scrollbar-none px-4 py-0.5 sm:mx-0 sm:flex-wrap sm:px-0";
const cornerOn = "animate-dot-pop border-accent-strong bg-background";

/** Model chips + tool list + setup card, modelled on jatevo.ai's "Connect your coding agents" (landing.js connect()). */
export function AgentConnect() {
  const [modelId, setModelId] = useState(pickable[0].id);
  const [toolId, setToolId] = useState("opencode");
  const toolRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const limited = responsesOnly.has(toolId);
  const canPick = (m: Model) => !limited || speaksResponses(m);
  // a tool that cannot use the picked model falls back to the first model it can
  const model = pickable.find((m) => m.id === modelId && canPick(m)) ?? pickable.find(canPick) ?? pickable[0];
  const tool = tools.find((t) => t.id === toolId) ?? tools[0];
  const setup = setups[tool.id](model);

  function onToolKey(e: KeyboardEvent, i: number) {
    const keys: Record<string, number> = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tools.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const j = (keys[e.key] + tools.length) % tools.length;
    setToolId(tools[j].id);
    toolRefs.current[j]?.focus();
  }

  return (
    <div>
      <div role="group" aria-label={copy.pickLabel} className={chipRow}>
        <span className="mr-1 shrink-0 text-xs text-muted-foreground">{copy.modelLabel}</span>
        {pickable.map((m) => {
          const ok = canPick(m);
          return (
            <button key={m.id} type="button" aria-pressed={m.id === model.id} aria-disabled={!ok || undefined}
              title={ok ? undefined : copy.responsesOnly} onClick={() => ok && setModelId(m.id)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 border border-foreground/15 bg-background pr-3 pl-2 text-ui font-medium text-foreground/80",
                "transition-colors duration-150 hover:bg-muted hover:text-foreground aria-pressed:border-accent-strong aria-pressed:bg-accent-soft",
                "aria-pressed:text-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-background",
                focusRing,
              )}>
              <span className="grid size-5.5 place-items-center border border-foreground/15 bg-background">
                <ProviderLogo icon={m.icon} className="size-3.5" />
              </span>
              {m.name}
            </button>
          );
        })}
      </div>
      <div data-reveal className="mt-4.5 grid grid-cols-1 items-center gap-5 lg:grid-cols-connect lg:gap-0">
        <div id="setup-panel" role="tabpanel" aria-labelledby={`tool-${tool.id}`}
          className="min-w-0 border border-foreground/15 bg-background shadow-2xl shadow-foreground/8">
          <div className="flex items-center justify-between gap-2.5 border-b border-border py-3 pr-3 pl-4 text-ui text-foreground/80">
            <span>{copy.setupIn} <b className="font-semibold text-foreground">{tool.name}</b></span>
            <CopyButton text={setupText(setup)} label={copy.copySetup} copiedLabel={copy.copied}
              className="h-7.5 border border-foreground/15 sm:h-7.5" />
          </div>
          <ol className="grid gap-2.5 px-4 pt-3.5 pb-1.5 text-ui leading-snug text-foreground/80">
            {[copy.step1, setup.note, copy.step3(tool.name, model.name)].map((step, i) => (
              <li key={i} className="grid grid-cols-step gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mx-4 mt-2.5 mb-4 border border-border bg-muted">
            <div className="border-b border-border px-3 py-2 font-mono text-xs text-muted-foreground">{setup.file}</div>
            <SetupBody key={`${tool.id}-${model.id}`} setup={setup} />
          </div>
        </div>
        <HubWires toolRefs={toolRefs} active={tools.indexOf(tool)} label={copy.hub} />
        <div role="tablist" aria-label={copy.toolLabel} className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-1">
          {tools.map((t, i) => (
            <ToolButton key={t.id} tool={t} selected={t.id === tool.id} modelIcon={model.icon}
              ref={(el) => { toolRefs.current[i] = el; }} onSelect={() => setToolId(t.id)} onKeyDown={(e) => onToolKey(e, i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

type ToolButtonProps = {
  tool: (typeof tools)[number];
  selected: boolean;
  modelIcon: string;
  ref: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
};

function ToolButton({ tool, selected, modelIcon, ref, onSelect, onKeyDown }: ToolButtonProps) {
  return (
    <button ref={ref} id={`tool-${tool.id}`} type="button" role="tab" aria-selected={selected} aria-controls="setup-panel"
      tabIndex={selected ? 0 : -1} onClick={onSelect} onKeyDown={onKeyDown}
      className={cn(
        "grid h-11 grid-cols-tool items-center gap-2.5 border border-foreground/15 bg-background pr-2.5 pl-2 text-left text-ui font-medium",
        "text-foreground/80 transition-colors duration-150 hover:bg-muted lg:h-10",
        "aria-selected:border-accent-strong aria-selected:bg-accent-soft aria-selected:text-foreground",
        focusRing,
      )}>
      <span className={cn("grid size-7 place-items-center border bg-background", selected ? "border-accent-strong" : "border-foreground/15")}>
        {tool.icon ? <ProviderLogo icon={tool.icon} className="size-4" /> : <span aria-hidden className="font-semibold">{tool.name[0]}</span>}
      </span>
      <span className="truncate">{tool.name}</span>
      <i aria-hidden className={cn("grid size-5.5 place-items-center border", selected ? cornerOn : "border-border bg-muted")}>
        {selected && <ProviderLogo icon={modelIcon} className="size-3" />}
      </i>
    </button>
  );
}
