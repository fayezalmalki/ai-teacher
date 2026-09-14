"use client";

import type { Choice } from "@/lib/lesson-engine/types";
import MicButton from "./MicButton";
import Choices from "./Choices";
import ThinkingDots from "./ThinkingDots";

export interface InteractionBarProps {
  mode: "mic" | "choices" | "thinking" | "speaking" | "pickHint" | "idle";
  recording?: boolean;
  onMic?: () => void;
  choices?: Choice[];
  onPick?: (index: number) => void;
  transcript?: string;
  thinkingLabel?: string;
  childInitial?: string;
  teacherName?: string;
}

/** Bottom bar of the session: mic, answer buttons, thinking + transcript, or hints. */
export default function InteractionBar({
  mode,
  recording = false,
  onMic,
  choices = [],
  onPick,
  transcript = "",
  thinkingLabel = "",
  childInitial = "س",
  teacherName = "الأستاذ نواف",
}: InteractionBarProps) {
  return (
    <div className="border-t border-border px-8 py-5 min-h-[112px] flex items-center justify-center gap-4 flex-wrap">
      {mode === "mic" && <MicButton recording={recording} onTap={() => onMic?.()} />}
      {mode === "thinking" && (
        <>
          {transcript && (
            <div className="flex items-center gap-3 px-[18px] py-3 rounded-tile bg-surface-3 text-[16px] text-ink animate-[fadeUp_.3s_ease]">
              <span className="w-7 h-7 rounded-full bg-success-tint text-success grid place-items-center font-semibold text-[13px]">
                {childInitial}
              </span>
              <span>{transcript}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-muted text-[16px]">
            <ThinkingDots />
            <span>{thinkingLabel}</span>
          </div>
        </>
      )}
      {mode === "choices" && <Choices choices={choices} onPick={(i) => onPick?.(i)} />}
      {mode === "speaking" && <div className="text-[15px] text-faint">{teacherName} يتحدث…</div>}
      {mode === "pickHint" && <div className="text-[16px] text-success font-medium">المس قطعتين من الشوكولاتة</div>}
    </div>
  );
}
