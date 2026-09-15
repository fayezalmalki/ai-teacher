"use client";

import Link from "next/link";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import { gradeLabel } from "@/lib/content/catalog";
import { useAppStore } from "@/lib/store/app-store";

export default function ProfilesPage() {
  const { state, childInitial } = useAppStore();
  return (
    <Frame>
      <AppHeader showParent />
      <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
        <div className="flex flex-col items-center gap-9">
          <h1 className="font-display text-[44px] font-bold m-0">من أنت؟</h1>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link
              href="/home"
              className="w-[190px] px-5 py-[30px] r-tile-1 ink bg-surface shadow-tint-blue flex flex-col items-center gap-3.5 text-ink hover:text-ink press"
            >
              <div className="w-[84px] h-[84px] r-dot ink bg-yellow grid place-items-center font-display text-[38px] font-bold">{childInitial}</div>
              <div className="font-display text-[24px] font-bold">{state.child.name}</div>
              <div className="text-[13px] text-muted">{gradeLabel(state.child.grade)}</div>
            </Link>
            <Link
              href="/onboarding"
              className="w-[190px] px-5 py-[30px] r-card-1 border-[3px] border-dashed border-border-dashed bg-transparent flex flex-col items-center gap-3.5 text-muted hover:bg-hover hover:text-muted"
            >
              <div className="w-[84px] h-[84px] rounded-full border-[3px] border-dashed border-border-dashed grid place-items-center text-[36px]">+</div>
              <div className="font-display text-[20px] font-semibold">طالب جديد</div>
            </Link>
          </div>
        </div>
      </div>
    </Frame>
  );
}
