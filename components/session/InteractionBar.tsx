"use client";

import { SketchButton } from "@/components/Sketch";
import type { Choice, IntroAnswerKind, IntroResponse } from "@/lib/lesson-engine/types";
import type { ListenError } from "@/lib/voice/types";
import MicButton from "./MicButton";
import Choices from "./Choices";
import ThinkingDots from "./ThinkingDots";

export interface InteractionBarProps {
  mode: "mic" | "choices" | "thinking" | "speaking" | "pickHint" | "idle";
  /** Reading mode: no mic; the child taps التالي to advance and taps an answer. */
  reading?: boolean;
  onAdvance?: () => void;
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
}

function IntroAnswers({
  responses,
  onPick,
  hint,
  retry,
}: {
  responses: Record<IntroAnswerKind, IntroResponse>;
  onPick: (kind: IntroAnswerKind) => void;
  hint: string;
  retry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 w-full">
      <div className="text-[15px] text-muted text-center">{hint}</div>
      <div className="flex gap-3 flex-wrap justify-center">
        {(Object.keys(responses) as IntroAnswerKind[]).map((k, i) => (
          <SketchButton key={k} variant="white" size="xs" index={i} pop popDelay={i * 0.08} onClick={() => onPick(k)} className="max-w-[260px] text-right leading-[1.3]">
            {responses[k].transcript}
          </SketchButton>
        ))}
        {retry && (
          <SketchButton size="xs" index={3} onClick={retry}>
            تكلم مرة ثانية
          </SketchButton>
        )}
      </div>
    </div>
  );
}

/** The one action zone (min-height 120): mic pill, answer buttons, thinking dots, or nothing. */
export default function InteractionBar({
  mode,
  reading = false,
  onAdvance,
  recording = false,
  onMic,
  listenError = null,
  introResponses,
  onIntroAnswer,
  choices = [],
  onPick,
  transcript = "",
  thinkingLabel = "",
}: InteractionBarProps) {
  return (
    <div className="min-h-[120px] flex items-center justify-center gap-4 flex-wrap px-6 sm:px-8 pt-3 pb-10">
      {mode === "speaking" && reading && (
        <SketchButton size="md" pop onClick={() => onAdvance?.()}>
          التالي
        </SketchButton>
      )}
      {mode === "mic" && reading && introResponses && (
        <IntroAnswers responses={introResponses} onPick={(k) => onIntroAnswer?.(k)} hint="اختر إجابتك:" />
      )}
      {mode === "mic" && !reading && !listenError && <MicButton recording={recording} onTap={() => onMic?.()} />}
      {mode === "mic" && !reading && listenError && introResponses && (
        <IntroAnswers
          responses={introResponses}
          onPick={(k) => onIntroAnswer?.(k)}
          hint={listenError === "mic-unavailable" ? "الميكروفون غير متاح. اختر أقرب إجابة لك:" : "ما سمعتك زين. اختر أقرب إجابة لك، أو جرّب تتكلم مرة ثانية:"}
          retry={listenError !== "mic-unavailable" ? () => onMic?.() : undefined}
        />
      )}
      {mode === "thinking" && (
        <>
          {transcript && (
            <div className="px-5 py-3 border-2 border-dashed border-ink r-input bg-surface text-[17px] motion animate-fade-up-fast">
              &quot;{transcript}&quot;
            </div>
          )}
          <div className="flex items-center gap-3 text-muted text-[16px]">
            <ThinkingDots />
            <span>{thinkingLabel}</span>
          </div>
        </>
      )}
      {mode === "choices" && <Choices choices={choices} onPick={(i) => onPick?.(i)} />}
      {mode === "pickHint" && <div className="text-[17px] text-primary font-medium">المس قطعتين</div>}
    </div>
  );
}
