import type { SaveNotice } from "./use-save-model";

/** Result of the last save under a table, announced to screen readers (alert for errors, status otherwise). */
export function SaveNoticeLine({ notice }: { notice: SaveNotice }) {
  if (!notice) return <p role="status" className="sr-only" />;
  const error = notice.kind === "error";
  return (
    <p role={error ? "alert" : "status"}
      className={`border-t border-app-border px-6 py-3 text-app-small ${error ? "text-app-danger" : "text-app-text-2"}`}>
      <span className="font-mono text-app-code">{notice.modelId}</span>: {notice.text}
    </p>
  );
}
