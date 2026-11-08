/** 400_000 -> "400K", 1_000_000 -> "1M" */
export function formatContext(tokens: number): string {
  return tokens >= 1_000_000 ? `${tokens / 1_000_000}M` : `${Math.round(tokens / 1_000)}K`;
}

/** 48_200_000 -> "48.2M", 1_213_408 -> "1.2M", 9_400 -> "9.4K" */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}
