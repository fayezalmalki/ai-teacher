/** Feature flags read from public env at build time. */

/**
 * Guided demo (default on): the child home shows only today's lesson and a
 * link to reveal the full library. Set NEXT_PUBLIC_GUIDED_DEMO=false to show
 * the library by default.
 */
export function guidedDemo(): boolean {
  const v = (process.env.NEXT_PUBLIC_GUIDED_DEMO ?? "true").trim().toLowerCase();
  return !(v === "false" || v === "0" || v === "off" || v === "no");
}
