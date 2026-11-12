import { NoticeLine } from "@/components/app-kit/notice-line";
import type { SaveNotice } from "./use-save-model";

/** Result of the last save under a table: "model-id: what changed", icon + words like every other notice. */
export function SaveNoticeLine({ notice }: { notice: SaveNotice }) {
  if (!notice) return null;
  return (
    <div className="border-t border-app-border px-6 py-3">
      <NoticeLine notice={{ kind: notice.kind, text: `${notice.modelId}: ${notice.text}` }} size="small" />
    </div>
  );
}
