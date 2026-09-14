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
      <div className="flex-1 grid place-items-center px-8 py-12">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-[32px] font-bold m-0">من أنت؟</h1>
          <div className="flex gap-5 flex-wrap justify-center">
            <Link
              href="/home"
              className="w-[180px] px-5 py-7 rounded-frame border-2 border-border-2 bg-surface flex flex-col items-center gap-3.5 text-ink hover:border-primary hover:bg-primary-tint-2 hover:text-ink"
            >
              <div className="w-20 h-20 rounded-full bg-success-tint text-success grid place-items-center text-[34px] font-bold">
                {childInitial}
              </div>
              <div className="text-[20px] font-semibold">{state.child.name}</div>
              <div className="text-[13px] text-muted">{gradeLabel(state.child.grade)}</div>
            </Link>
            <Link
              href="/onboarding"
              className="w-[180px] px-5 py-7 rounded-frame border-2 border-dashed border-border-dashed bg-surface flex flex-col items-center gap-3.5 text-muted hover:bg-surface-3 hover:text-muted"
            >
              <div className="w-20 h-20 rounded-full bg-surface-3 grid place-items-center text-[34px]">+</div>
              <div className="text-[18px] font-medium">طالب جديد</div>
              <div className="text-[13px]">يتطلب ولي الأمر</div>
            </Link>
          </div>
        </div>
      </div>
    </Frame>
  );
}
