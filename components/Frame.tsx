import type { ReactNode } from "react";

interface FrameProps {
  children: ReactNode;
  /** Session pages leave room at the bottom for the demo controls. */
  variant?: "app" | "session";
}

/** The single 1040px white frame every screen lives in. */
export default function Frame({ children, variant = "app" }: FrameProps) {
  const session = variant === "session";
  return (
    <div
      className={
        "min-h-screen grid px-6 bg-page " +
        (session ? "place-items-center pt-6 pb-[140px]" : "place-items-[start_center] py-6")
      }
    >
      <div
        className={
          "w-full max-w-[1040px] bg-surface rounded-frame shadow-frame flex flex-col relative overflow-hidden " +
          (session ? "min-h-[700px]" : "min-h-[720px]")
        }
      >
        {children}
      </div>
    </div>
  );
}
