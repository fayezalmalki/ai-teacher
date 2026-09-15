"use client";

/**
 * The open "ask the teacher" moment: a bounded, full-duplex conversation
 * with Gemini Live (or the offline mock). The lesson engine owns the step;
 * this screen only reports finished exchanges back and returns to the end
 * screen when the child is done or a cap is reached.
 */
import { useEffect, useRef, useState } from "react";
import Teacher from "@/components/Teacher";
import Subtitle from "@/components/Subtitle";
import { SketchButton } from "@/components/Sketch";
import { toArabicDigits } from "@/lib/format";
import { fill, type LessonDefinition } from "@/lib/lesson-engine";
import type { CharacterMode } from "@/lib/character/contract";
import { createLiveSession, LiveUnavailableError, type LiveSession, type LiveStatus } from "@/lib/voice/live";
import type { Viseme } from "@/lib/voice/types";

interface AskTeacherProps {
  lesson: LessonDefinition;
  name: string;
  childInitial: string;
  character: CharacterMode;
  forceMock?: boolean;
  onTurn: (question: string, answer: string) => void;
  onClose: () => void;
}

interface Line {
  who: "child" | "teacher";
  text: string;
}

export default function AskTeacher({ lesson, name, childInitial, character, forceMock, onTurn, onClose }: AskTeacherProps) {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [viseme, setViseme] = useState<Viseme>(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const session = useRef<LiveSession | null>(null);
  const closedByUser = useRef(false);
  const onTurnRef = useRef(onTurn);
  onTurnRef.current = onTurn;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let alive = true;
    let ticker: ReturnType<typeof setInterval> | null = null;
    createLiveSession({ lessonId: lesson.id, childName: name, forceMock })
      .then(async (s) => {
        if (!alive) {
          s.close();
          return;
        }
        session.current = s;
        await s.start({
          onStatus: (st) => {
            setStatus(st);
            if (st === "closed" && !closedByUser.current) setTimeout(() => onCloseRef.current(), 900);
          },
          onInputTranscript: (text, final) => {
            setDraftQuestion(final ? "" : text);
            if (final && text) setLines((l) => [...l, { who: "child", text }]);
          },
          onOutputTranscript: (text) => setDraftAnswer(text),
          onTurn: (q, a) => {
            setDraftQuestion("");
            setDraftAnswer("");
            setLines((l) => (a ? [...l, { who: "teacher", text: a }] : l));
            onTurnRef.current(q, a);
          },
          onViseme: setViseme,
          onLevel: setLevel,
          onLimit: () => {},
          onError: (m) => setUnavailable(m),
        });
        ticker = setInterval(() => setRemaining(s.remainingMs()), 1000);
        setRemaining(s.remainingMs());
      })
      .catch((err) => {
        if (!alive) return;
        setUnavailable(err instanceof LiveUnavailableError ? lesson.ask.unavailable : lesson.ask.unavailable);
        setStatus("error");
        console.warn("[ask] live session unavailable:", err);
      });
    return () => {
      alive = false;
      if (ticker) clearInterval(ticker);
      session.current?.close();
      session.current = null;
    };
  }, [lesson.id, lesson.ask.unavailable, name, forceMock]);

  const finish = () => {
    closedByUser.current = true;
    session.current?.close();
    onClose();
  };

  const teacherState = status === "speaking" ? "speaking" : status === "listening" ? "listening" : "idle";
  const secs = remaining === null ? null : Math.ceil(remaining / 1000);
  const lastTeacher = [...lines].reverse().find((l) => l.who === "teacher")?.text ?? "";
  const sentence = unavailable ? unavailable : draftAnswer || lastTeacher || fill(lesson.ask.greeting, { name });

  return (
    <>
      <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 items-center px-6 sm:px-14 pt-10 pb-6 max-w-[1100px] w-full mx-auto">
        <div className="flex flex-col items-start gap-7 min-w-0">
          <Teacher size={120} state={teacherState} viseme={viseme} level={level} character={character} />
          <Subtitle id={sentence} text={sentence} size={unavailable ? 26 : 34} />
          {status === "connecting" && !unavailable && <div className="text-[14px] text-muted">يتصل…</div>}
        </div>

        <div className="flex flex-col gap-3.5 min-h-[340px]">
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto" aria-live="polite">
            {!unavailable && lines.length === 0 && !draftQuestion && (
              <div className="m-auto text-center text-[15px] text-muted max-w-[360px]">{lesson.ask.hint}</div>
            )}
            {lines.map((l, i) => (
              <Bubble key={i} who={l.who} text={l.text} initial={childInitial} index={i} />
            ))}
            {draftQuestion && <Bubble who="child" text={draftQuestion} initial={childInitial} index={lines.length} draft />}
          </div>
          {secs !== null && status !== "closed" && status !== "error" && (
            <div className="text-[13px] text-muted tabular-nums text-left" dir="ltr">
              {toArabicDigits(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`)}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[120px] flex items-center justify-center gap-4 flex-wrap px-6 sm:px-8 pt-3 pb-10">
        {status === "listening" && (
          <span className="inline-flex items-center gap-3 px-6 py-3.5 rounded-pill ink bg-success text-white font-display text-[20px] font-bold leading-none motion animate-pop-in-fast">
            <span
              className="inline-block w-3 h-3 rounded-full bg-white"
              style={{ transform: `scale(${1 + level * 1.4})`, transition: "transform 80ms linear" }}
            />
            أسمعك
          </span>
        )}
        <SketchButton variant={unavailable ? "primary" : "white"} index={1} onClick={finish}>
          {unavailable ? "نكمل" : lesson.ask.done}
        </SketchButton>
      </div>
    </>
  );
}

function Bubble({ who, text, initial, index, draft }: { who: "child" | "teacher"; text: string; initial: string; index: number; draft?: boolean }) {
  const child = who === "child";
  return (
    <div className={"flex items-start gap-2.5 " + (child ? "" : "flex-row-reverse")} style={{ opacity: draft ? 0.6 : 1 }}>
      <span className={"w-7 h-7 r-chip-initial ink-2 grid place-items-center font-semibold text-[13px] flex-none " + (child ? "bg-yellow" : "bg-primary-tint")}>
        {child ? initial : "ن"}
      </span>
      <div className={`px-4 py-2.5 ink-2 ${index % 2 ? "r-bubble-2" : "r-bubble-1"} text-[16px] leading-[1.55] max-w-[85%] ${child ? "bg-surface" : "bg-primary-tint"} text-ink`}>
        {text}
      </div>
    </div>
  );
}
