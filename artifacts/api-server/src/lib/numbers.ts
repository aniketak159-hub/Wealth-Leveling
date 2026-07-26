/**
 * Parse a Drizzle numeric-column value (returned as string) into a JS number.
 * Returns `fallback` (default 0) for null, undefined, empty string, or NaN so
 * that response serialisers never propagate NaN into JSON.
 */
export function safeFloat(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const n = typeof val === "number" ? val : parseFloat(String(val));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Same as safeFloat but rounds to `dp` decimal places.
 * Useful for monetary values that must display cleanly.
 */
export function safeFloatRounded(val: unknown, dp = 2, fallback = 0): number {
  const n = safeFloat(val, fallback);
  return Math.round(n * 10 ** dp) / 10 ** dp;
}
