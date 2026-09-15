"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { getPublicConvexUrl } from "./config";

const url = getPublicConvexUrl();
const client = url ? new ConvexReactClient(url) : null;

/** Wraps the app when a Convex URL is configured; otherwise renders children untouched. */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
