"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/content/catalog";
import { useAppStore } from "@/lib/store/app-store";

interface AppHeaderProps {
  back?: boolean;
  /** Fallback route when there is no history to go back to. */
  backHref?: string;
  showChild?: boolean;
  showParent?: boolean;
  /** Session variant: lesson title + subtitle instead of the app name. */
  lesson?: { title: string; subtitle: string };
  /** Slot between the brand and the child chip (session progress dots). */
  center?: ReactNode;
  onBrandTap?: () => void;
}

export function ChildChip({ size = 32 }: { size?: number }) {
  const { state, childInitial } = useAppStore();
  return (
    <div className="flex items-center gap-2 text-[14px] text-ink-2">
      <span>{state.child.name}</span>
      <div
        className="rounded-full bg-success-tint text-success grid place-items-center font-semibold text-[14px]"
        style={{ width: size, height: size }}
      >
        {childInitial}
      </div>
    </div>
  );
}

export default function AppHeader({
  back = true,
  backHref = "/",
  showChild = false,
  showParent = false,
  lesson,
  center,
  onBrandTap,
}: AppHeaderProps) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(backHref);
  };
  return (
    <div
      className={
        "flex items-center justify-between gap-4 border-b border-border " +
        (lesson ? "px-7 py-5 flex-wrap" : "px-7 py-[18px]")
      }
    >
      <div className="flex items-center gap-3">
        {back && (
          <button
            type="button"
            onClick={goBack}
            aria-label="رجوع"
            className="w-9 h-9 rounded-chip border border-border-2 bg-surface text-[18px] text-ink-2 grid place-items-center hover:bg-surface-3"
          >
            →
          </button>
        )}
        {lesson ? (
          <div className="flex items-center gap-3" onClick={onBrandTap}>
            <div className="w-9 h-9 rounded-chip bg-primary-tint text-primary grid place-items-center font-bold text-[15px]">
              ن
            </div>
            <div>
              <div className="font-semibold text-[16px]">{lesson.title}</div>
              <div className="text-[13px] text-muted">{lesson.subtitle}</div>
            </div>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 bg-transparent border-0 p-0" onClick={onBrandTap}>
            <div className="w-9 h-9 rounded-chip bg-primary-tint text-primary grid place-items-center font-bold text-[15px]">
              ن
            </div>
            <div className="font-semibold text-[16px] text-ink">{APP_NAME}</div>
          </Link>
        )}
      </div>
      {center}
      <div className="flex items-center gap-2.5">
        {showChild && <ChildChip />}
        {showParent && (
          <Link
            href="/parent/pin"
            className="px-3.5 py-2 rounded-pill border border-border-2 bg-surface text-[13px] text-ink-2 font-medium hover:bg-surface-3 hover:text-ink-2"
          >
            ولي الأمر
          </Link>
        )}
      </div>
    </div>
  );
}
