import { cn } from "@/lib/utils";

/** A single figure with its label and a small note under it. */
export function StatTile({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "danger" }) {
  return (
    <div className="min-w-0 rounded-panel border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-xl tabular-nums">{value}</p>
      {note && <p className={cn("mt-1 text-sm", tone === "danger" ? "text-destructive" : "text-muted-foreground")}>{note}</p>}
    </div>
  );
}
