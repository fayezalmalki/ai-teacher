/** Convex is optional: without NEXT_PUBLIC_CONVEX_URL the app stays local-only. */
export function getPublicConvexUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  return url ? url : null;
}

export function convexEnabled(): boolean {
  return getPublicConvexUrl() !== null;
}
