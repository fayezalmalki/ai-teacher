import type { ReactNode } from "react";

interface FrameProps {
  children: ReactNode;
  /** Kept for call-site compatibility; v2 has no frame, the page is the surface. */
  variant?: "app" | "session";
}

/** v2: no card, no header bar. Cream page, content stacks in a column. */
export default function Frame({ children }: FrameProps) {
  return <div className="min-h-screen bg-page flex flex-col relative">{children}</div>;
}
