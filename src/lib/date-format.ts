/** "2026-11-08T09:14:22Z" -> "2026-11-08 09:14" (UTC, as stored); a bare date passes through. */
export function formatUtc(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}
