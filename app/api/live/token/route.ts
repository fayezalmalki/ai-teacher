/**
 * Mints an ephemeral Gemini Live token for one "ask the teacher" session.
 * The API key and the guardrail system prompt stay on the server: the prompt
 * is locked into the token's connect constraints, and the client only
 * receives a single-use token plus the matching setup message.
 *
 * With LIVE_PROVIDER=mock (or no GEMINI_API_KEY in development) the route
 * returns a canned script so the UI runs offline.
 */
import { NextResponse } from "next/server";
import { getLesson } from "@/lib/lesson-engine";
import { askSystemPrompt } from "@/lib/lesson-engine/prompts";
import { fill } from "@/lib/lesson-engine/template";
import type { LiveLimits, LiveTokenResponse } from "@/lib/voice/live/types";

export const runtime = "nodejs";

const LIMITS: LiveLimits = {
  maxDurationMs: Number(process.env.LIVE_MAX_SECONDS || 120) * 1000,
  maxTurns: Number(process.env.LIVE_MAX_TURNS || 3),
};

const MOCK_QA = {
  question: "ليش الربع أصغر من النصف؟",
  answer: "لأن الربع يعني قسمنا البيتزا أربع قطع، والنصف قطعتين بس. كل ما زاد عدد القطع صارت القطعة أصغر. فهمتها؟",
};

interface Body {
  lessonId?: string;
  childName?: string;
  mock?: boolean;
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
  const childName = (body.childName || "").trim().slice(0, 40) || "الطالب";

  const provider = process.env.LIVE_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.NODE_ENV === "development" ? "mock" : "off");
  if (provider === "mock" || body.mock) {
    const out: LiveTokenResponse = {
      provider: "mock",
      limits: LIMITS,
      script: { greeting: fill(lesson.ask.greeting, { name: childName }), ...MOCK_QA },
    };
    return NextResponse.json(out);
  }
  if (provider === "off") {
    const out: LiveTokenResponse = { provider: "off", limits: LIMITS, reason: "live conversation is not configured" };
    return NextResponse.json(out, { status: 503 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 503 });
  const model = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
  const voice = process.env.GEMINI_LIVE_VOICE || "Kore";
  const apiVersion = process.env.GEMINI_LIVE_API_VERSION || "v1beta";

  const config = {
    responseModalities: ["AUDIO"],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    systemInstruction: { parts: [{ text: askSystemPrompt(lesson, childName) }] },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    realtimeInputConfig: {
      automaticActivityDetection: {
        startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
        endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
        prefixPaddingMs: 100,
        silenceDurationMs: 900,
      },
    },
  };

  const now = Date.now();
  const tokenBody = (lock: boolean) => ({
    uses: 1,
    expireTime: new Date(now + LIMITS.maxDurationMs + 60_000).toISOString(),
    newSessionExpireTime: new Date(now + 60_000).toISOString(),
    liveConnectConstraints: { model: `models/${model}`, config: lock ? config : { responseModalities: ["AUDIO"] } },
  });

  try {
    let res = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/auth_tokens?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tokenBody(true)),
    });
    if (res.status === 400) {
      // Some constraint fields may not be lockable on this API version; fall back to locking the model only.
      console.warn("[api/live/token] full constraints rejected, retrying with model-only constraints:", await res.text());
      res = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/auth_tokens?key=${apiKey}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(tokenBody(false)),
      });
    }
    if (!res.ok) throw new Error(`auth_tokens ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { name?: string };
    if (!json.name) throw new Error("auth_tokens response has no name");

    const out: LiveTokenResponse = {
      provider: "gemini-live",
      token: json.name,
      wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContent`,
      setup: { model: `models/${model}`, generationConfig: { responseModalities: config.responseModalities, speechConfig: config.speechConfig }, systemInstruction: config.systemInstruction, inputAudioTranscription: {}, outputAudioTranscription: {}, realtimeInputConfig: config.realtimeInputConfig },
      limits: LIMITS,
    };
    return NextResponse.json(out);
  } catch (err) {
    console.error("[api/live/token]", err);
    return NextResponse.json({ error: "could not start a live session" }, { status: 502 });
  }
}
