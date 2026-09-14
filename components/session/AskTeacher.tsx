"use client";

/**
 * The open "ask the teacher" moment: a bounded, full-duplex conversation
 * with Gemini Live (or the offline mock). The lesson engine owns the step;
 * this screen only reports finished exchanges back and returns to the end
 * screen when the child is done or a cap is reached.
 */
import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import StatusPill, { type StatusTone } from "@/components/StatusPill";
import Teacher from "@/components/Teacher";
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

const STATUS: Record<LiveStatus, { label: string; tone: StatusTone; active: boolean }> = {
  connecting: { label: "يتصل…", tone: "neutral", active: false },
  listening: { label: "أنا أسمعك", tone: "success", active: true },
  speaking: { label: "يتحدث…", tone: "primary", active: true },
  closed: { label: "انتهت المحادثة", tone: "neutral", active: false },
  error: { label: "تعذّر الاتصال", tone: "neutral", active: false },
};

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

  const st = STATUS[status];
  const teacherState = status === "speaking" ? "speaking" : status === "listening" ? "listening" : "idle";
  const secs = remaining === null ? null : Math.ceil(remaining / 1000);

  return (
    <>
      <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 px-8 pt-9 pb-6">
        <div className="flex flex-col items-start gap-5">
          <Teacher size={128} glyphSize={52} state={teacherState} viseme={viseme} level={level} character={character} />
          <StatusPill label={st.label} tone={st.tone} active={st.active} />
          <div className="text-[15px] text-muted">{lesson.teacher}</div>
          <div>
            <div className="text-[14px] text-muted">{lesson.ask.title}</div>
            <div className="text-[22px] leading-[1.6] font-medium text-ink text-pretty-wrap max-w-[440px] mt-1">
              {draftAnswer || (lines.length ? "" : fill(lesson.ask.greeting, { name }))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex-1 min-h-[360px] rounded-card bg-surface-2 p-6 flex flex-col gap-3 overflow-y-auto" aria-live="polite">
            {unavailable ? (
              <div className="m-auto text-center text-[17px] text-ink-2 max-w-[360px]">{unavailable}</div>
            ) : (
              <>
                {lines.length === 0 && !draftQuestion && (
                  <div className="m-auto text-center text-[15px] text-muted max-w-[360px]">{lesson.ask.hint}</div>
                )}
                {lines.map((l, i) => (
                  <Bubble key={i} who={l.who} text={l.text} initial={childInitial} />
                ))}
                {draftQuestion && <Bubble who="child" text={draftQuestion} initial={childInitial} draft />}
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
            <span>{status === "listening" ? "الميكروفون مفتوح" : status === "speaking" ? "الميكروفون مفتوح، تقدر تقاطعه" : ""}</span>
            {secs !== null && status !== "closed" && status !== "error" && (
              <span className="font-mono tabular-nums">
                {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-8 py-5 min-h-[112px] flex items-center justify-center gap-4 flex-wrap">
        {status === "listening" && (
          <span className="inline-flex items-center gap-3 px-6 py-3.5 rounded-pill bg-success-tint text-success text-[16px] font-semibold">
            <span
              className="inline-block w-3 h-3 rounded-full bg-success"
              style={{ transform: `scale(${1 + level * 1.4})`, transition: "transform 80ms linear" }}
            />
            تكلم، أنا أسمعك
          </span>
        )}
        <Button variant={unavailable ? "primary" : "secondary"} onClick={finish} className="px-7 py-4 text-[17px]">
          {unavailable ? "نكمل" : lesson.ask.done}
        </Button>
      </div>
    </>
  );
}

function Bubble({ who, text, initial, draft }: { who: "child" | "teacher"; text: string; initial: string; draft?: boolean }) {
  const child = who === "child";
  return (
    <div className={"flex items-start gap-2.5 " + (child ? "" : "flex-row-reverse")} style={{ opacity: draft ? 0.6 : 1 }}>
      <span
        className={
          "w-7 h-7 rounded-full grid place-items-center font-semibold text-[13px] flex-none " +
          (child ? "bg-success-tint text-success" : "bg-primary-tint text-primary")
        }
      >
        {child ? initial : "ن"}
      </span>
      <div className={"px-4 py-2.5 rounded-tile text-[16px] leading-[1.55] max-w-[85%] " + (child ? "bg-surface text-ink" : "bg-primary-tint-2 text-ink")}>
        {text}
      </div>
    </div>
  );
}
