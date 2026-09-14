/**
 * Assess a child's answer against the current turn. Returns the structured
 * ModelTurn contract plus the IntroAnswerKind the engine branches on. The
 * state machine, not the model, decides the next step.
 */
import { NextResponse } from "next/server";
import { getLesson } from "@/lib/lesson-engine";
import type { TurnState } from "@/lib/lesson-engine/contract";
import { assess, assessProviderFromEnv, modelTurnToIntroKind } from "@/lib/voice/server/providers";

export const runtime = "nodejs";

interface Body {
  lessonId?: string;
  transcript?: string;
  teacherLine?: string;
  turnState?: TurnState;
  childName?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const lesson = getLesson(body.lessonId ?? "");
  if (!lesson) return NextResponse.json({ error: "unknown lesson" }, { status: 400 });
  if (!body.turnState || typeof body.teacherLine !== "string") {
    return NextResponse.json({ error: "turnState and teacherLine are required" }, { status: 400 });
  }
  const transcript = typeof body.transcript === "string" ? body.transcript.slice(0, 1000) : "";
  const provider = assessProviderFromEnv();
  try {
    const turn = await assess(
      { transcript, teacherLine: body.teacherLine, turnState: body.turnState, childName: body.childName || "الطالب", lesson },
      provider,
    );
    return NextResponse.json({ provider, turn, kind: modelTurnToIntroKind(turn, transcript) });
  } catch (err) {
    console.error("[api/assess]", err);
    return NextResponse.json({ error: "assessment failed" }, { status: 502 });
  }
}
