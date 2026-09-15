"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/content/catalog";
import { useAppStore } from "@/lib/store/app-store";
import { SketchPill } from "./Sketch";

interface AppHeaderProps {
  back?: boolean;
  backHref?: string;
  /** Handle back in-page (e.g. previous onboarding step) instead of leaving the route. */
  onBack?: () => void;
  showChild?: boolean;
  showParent?: boolean;
}

/** 30px wobbly ink circle with the child's initial. */
export function ChildChip({ size = 30 }: { size?: number }) {
  const { childInitial } = useAppStore();
  return (
    <div
      className="r-chip-initial ink-2 bg-surface grid place-items-center text-[13px] font-semibold"
      style={{ width: size, height: size }}
      aria-label="الطالب"
    >
      {childInitial}
    </div>
  );
}

export function BackButton({ href = "/", onClick }: { href?: string; onClick?: () => void }) {
  const router = useRouter();
  const goBack = () => {
    if (onClick) onClick();
    else if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(href);
  };
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="رجوع"
      className="w-[34px] h-[34px] r-dot ink-2 bg-surface text-[16px] grid place-items-center hover:bg-hover"
    >
      →
    </button>
  );
}

/**
 * v2 corner chrome: back + wordmark on the start side, parent pill + child
 * initial on the end side. 22px from the top, 32px from the sides. The session
 * draws its own row instead.
 */
export default function AppHeader({ back = true, backHref = "/", onBack, showChild = false, showParent = false }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-8 pt-[22px]">
      <div className="flex items-center gap-2.5">
        {back && <BackButton href={backHref} onClick={onBack} />}
        <Link href="/" className="font-display text-[18px] font-bold text-ink hover:text-ink whitespace-nowrap">
          {APP_NAME}
        </Link>
      </div>
      <div className="flex items-center gap-2.5">
        {showParent && <SketchPill href="/parent/pin">ولي الأمر</SketchPill>}
        {showChild && <ChildChip />}
      </div>
    </div>
  );
}
