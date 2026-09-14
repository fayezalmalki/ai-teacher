"use client";

import type { Choice, IntroAnswerKind, IntroResponse } from "@/lib/lesson-engine/types";
import type { ListenError } from "@/lib/voice/types";
import MicButton from "./MicButton";
import Choices from "./Choices";
import ThinkingDots from "./ThinkingDots";

export interface InteractionBarProps {
  mode: "mic" | "choices" | "thinking" | "speaking" | "pickHint" | "idle";
  recording?: boolean;
  onMic?: () => void;
  /** When the mic failed: show the scripted answers as tappable choices. */
  listenError?: ListenError | null;
  introResponses?: Record<IntroAnswerKind, IntroResponse>;
  onIntroAnswer?: (kind: IntroAnswerKind) => void;
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
  listenError = null,
  introResponses,
  onIntroAnswer,
  choices = [],
  onPick,
  transcript = "",
  thinkingLabel = "",
  childInitial = "س",
  teacherName = "الأستاذ نواف",
}: InteractionBarProps) {
  return (
    <div className="border-t border-border px-8 py-5 min-h-[112px] flex items-center justify-center gap-4 flex-wrap">
      {mode === "mic" && !listenError && <MicButton recording={recording} onTap={() => onMic?.()} />}
      {mode === "mic" && listenError && introResponses && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="text-[15px] text-muted">
            {listenError === "mic-unavailable" ? "الميكروفون غير متاح. اختر أقرب إجابة لك:" : "ما سمعتك زين. اختر أقرب إجابة لك، أو جرّب تتكلم مرة ثانية:"}
          </div>
          <div className="flex gap-2.5 flex-wrap justify-center">
            {(Object.keys(introResponses) as IntroAnswerKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onIntroAnswer?.(k)}
                className="px-4 py-3 rounded-tile border-2 border-border-2 bg-surface text-[16px] font-medium text-ink transition-all duration-200 hover:border-primary hover:bg-primary-tint-2 max-w-[260px] text-right"
              >
                {introResponses[k].transcript}
              </button>
            ))}
            {listenError !== "mic-unavailable" && (
              <button
                type="button"
                onClick={() => onMic?.()}
                className="px-4 py-3 rounded-pill border-0 bg-primary text-white text-[15px] font-semibold hover:bg-primary-hover"
              >
                تكلم مرة ثانية
              </button>
            )}
          </div>
        </div>
      )}
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
