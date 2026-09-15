"use client";

import { useState } from "react";
import type { DemoPath } from "@/lib/lesson-engine/types";

interface DemoControlsProps {
  active: boolean;
  onPath: (path: DemoPath) => void;
  engineJson?: string;
  childName: string;
}

const PATHS: { path: DemoPath; label: string }[] = [
  { path: "understands", label: "يفهم" },
  { path: "confused", label: "محتار / لا أعرف" },
  { path: "wrong", label: "إجابة خاطئة" },
  { path: "strong", label: "أداء قوي" },
];

/** Fixed bottom-left ink panel with the four demo paths. Enabled only while the teacher waits. */
export default function DemoControls({ active, onPath, engineJson, childName }: DemoControlsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed left-5 bottom-5 flex flex-col items-start gap-2.5 z-10" dir="rtl">
      {open && (
        <div className="w-60 bg-ink text-white r-input ink p-3.5 flex flex-col gap-2.5 shadow-pop-sm motion animate-pop-in-fast">
          <div className="text-[12px] text-faint tracking-[.04em]">DEMO · مسار الطفل</div>
          <div className="grid grid-cols-2 gap-2">
            {PATHS.map((p, i) => (
              <button
                key={p.path}
                type="button"
                disabled={!active}
                onClick={() => onPath(p.path)}
                className={`p-2.5 r-small border-2 border-dark-3 bg-dark-2 text-white text-[13px] font-medium hover:bg-dark-3 disabled:hover:bg-dark-2 ${i % 2 ? "r-chip" : "r-small"}`}
                style={{ opacity: active ? 1 : 0.4 }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-faint">
            {active ? `اختر المسار الذي يتبعه ${childName} الآن` : "تُفعَّل الأزرار عندما ينتظر المعلم إجابة"}
          </div>
          {engineJson && (
            <pre dir="ltr" className="font-mono text-[11px] leading-[1.6] bg-dark-code r-small p-2.5 text-dark-code-text whitespace-pre m-0 overflow-x-auto">
              {engineJson}
            </pre>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-3.5 py-2 rounded-pill ink-2 bg-ink text-white text-[13px] font-semibold shadow-pop-sm hover:bg-dark-2"
      >
        {open ? "إغلاق Demo" : "Demo"}
      </button>
    </div>
  );
}
