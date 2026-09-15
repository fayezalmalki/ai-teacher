"use client";

import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader, { AVATAR_BG } from "@/components/AppHeader";
import Link from "next/link";
import { gradeLabel } from "@/lib/content/catalog";
import { initialOf } from "@/lib/store/state";
import { useAppStore } from "@/lib/store/app-store";

/** Pick who is learning today. Each tile is a child; the dashed tile adds one (parent flow). */
export default function ProfilesPage() {
  const router = useRouter();
  const { state, setActiveChild } = useAppStore();
  const choose = (id: string) => {
    setActiveChild(id);
    router.push("/home");
  };
  return (
    <Frame>
      <AppHeader showParent />
      <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
        <div className="flex flex-col items-center gap-9">
          <h1 className="font-display text-[44px] font-bold m-0">من أنت؟</h1>
          <div className="flex gap-6 flex-wrap justify-center">
            {state.children.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => choose(c.id)}
                className={`w-[190px] px-5 py-[30px] ${i % 2 ? "r-card-2" : "r-tile-1"} ink bg-surface ${i % 3 === 0 ? "shadow-tint-blue" : i % 3 === 1 ? "shadow-tint-yellow" : "shadow-tint-green"} flex flex-col items-center gap-3.5 text-ink press`}
              >
                <div className={`w-[84px] h-[84px] r-dot ink grid place-items-center font-display text-[38px] font-bold ${AVATAR_BG[c.color]}`}>{initialOf(c.name)}</div>
                <div className="font-display text-[24px] font-bold">{c.name}</div>
                <div className="text-[13px] text-muted">{gradeLabel(c.grade)}</div>
              </button>
            ))}
            <Link
              href="/onboarding?new=1"
              className="w-[190px] px-5 py-[30px] r-card-1 border-[3px] border-dashed border-border-dashed bg-transparent flex flex-col items-center gap-3.5 text-muted hover:bg-hover hover:text-muted"
            >
              <div className="w-[84px] h-[84px] rounded-full border-[3px] border-dashed border-border-dashed grid place-items-center text-[36px]">+</div>
              <div className="font-display text-[20px] font-semibold">طالب جديد</div>
              <div className="text-[13px]">يتطلب ولي الأمر</div>
            </Link>
          </div>
        </div>
      </div>
    </Frame>
  );
}
