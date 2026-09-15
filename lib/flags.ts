/** Feature flags read from public env at build time. */

/**
 * Guided demo (default off): the child home shows only today's lesson and a
 * link to reveal the full library. Set NEXT_PUBLIC_GUIDED_DEMO=true to hide
 * the library behind that link (investor demo).
 */
export function guidedDemo(): boolean {
  const v = (process.env.NEXT_PUBLIC_GUIDED_DEMO ?? "false").trim().toLowerCase();
  return v === "true" || v === "1" || v === "on" || v === "yes";
}
