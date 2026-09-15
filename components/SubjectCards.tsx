"use client";

import Link from "next/link";
import { SUBJECTS, type Tone } from "@/lib/content/catalog";
import { openLessonsLabel, subjectPercent } from "@/lib/content/paths";
import { useAppStore } from "@/lib/store/app-store";
import { cardRadius } from "./Sketch";

const TINT: Record<Tone, string> = {
  blue: "shadow-tint-blue",
  green: "shadow-tint-green",
  amber: "shadow-tint-yellow",
  neutral: "shadow-tint-blue",
};

const BAR: Record<Tone, string> = {
  blue: "bg-primary",
  green: "bg-success",
  amber: "bg-yellow",
  neutral: "bg-ink",
};

const GLYPH_BG: Record<Tone, string> = {
  blue: "bg-primary-tint",
  green: "bg-success-tint",
  amber: "bg-yellow",
  neutral: "bg-surface",
};

interface SubjectCardsProps {
  /** Show the active child's progress bar under each subject. */
  progress?: boolean;
  className?: string;
}

/** One card per subject: glyph, name, blurb, how many lessons are open, and (in-app) the child's progress. */
export default function SubjectCards({ progress = false, className = "" }: SubjectCardsProps) {
  const { results } = useAppStore();
  return (
    <div className={"grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 " + className}>
      {SUBJECTS.map((s, i) => {
        const pct = progress ? subjectPercent(s.id, results) : 0;
        return (
          <Link
            key={s.id}
            href={`/subjects/${s.id}`}
            data-subject={s.id}
            className={`flex flex-col gap-3 p-5 ${cardRadius(i)} ink bg-surface ${TINT[s.tone]} text-ink hover:text-ink transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-sm`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 r-dot ink-2 grid place-items-center font-display text-[22px] font-bold ${GLYPH_BG[s.tone]}`}>{s.glyph}</div>
              <div className="min-w-0">
                <div className="font-display text-[22px] font-bold leading-tight">{s.name}</div>
                <div className="text-[13px] text-muted">{openLessonsLabel(s.id)}</div>
              </div>
            </div>
            <div className="text-[14px] leading-[1.6] text-ink-2">{s.blurb}</div>
            {progress && (
              <div className="flex items-center gap-2.5 mt-auto">
                <div className="flex-1 h-2 rounded-[4px] ink-2 overflow-hidden bg-surface">
                  <div className={"h-full " + BAR[s.tone]} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[12px] text-muted w-9 text-left">{pct}%</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
