/** Absolute, locale-aware version label, e.g. "May 27, 2026, 2:14 PM". */
export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Compact label for tight spaces, e.g. "May 27, 2:14 PM". */
export function formatTimestampShort(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
