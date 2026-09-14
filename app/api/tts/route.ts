/**
 * Cache-miss synthesis for the cascaded voice adapter (e.g. a child name that
 * was not pre-rendered). Returns base64 audio plus a viseme track. Keys stay
 * on the server; the browser never talks to the TTS vendor directly.
 */
import { NextResponse } from "next/server";
import { synthesize, ttsConfigFromEnv } from "@/lib/voice/server/providers";

export const runtime = "nodejs";

const MAX_CHARS = 400;

export async function POST(req: Request) {
  let body: { text?: unknown };
  try {
    body = (await req.json()) as { text?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (text.length > MAX_CHARS) return NextResponse.json({ error: `text longer than ${MAX_CHARS} chars` }, { status: 413 });

  const cfg = ttsConfigFromEnv();
  if (cfg.provider === "mock") {
    return NextResponse.json({ error: "tts not configured" }, { status: 503 });
  }
  try {
    const s = await synthesize(text, cfg);
    return NextResponse.json({
      provider: cfg.provider,
      mime: s.mime,
      durationMs: s.durationMs,
      visemes: s.visemes,
      aligned: s.aligned,
      audio: Buffer.from(s.audio).toString("base64"),
    });
  } catch (err) {
    console.error("[api/tts]", err);
    return NextResponse.json({ error: "synthesis failed" }, { status: 502 });
  }
}
