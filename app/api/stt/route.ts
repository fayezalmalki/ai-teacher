/**
 * Speech-to-text for one child utterance. Accepts multipart/form-data with an
 * `audio` file (webm/opus from MediaRecorder). The audio is transcribed and
 * discarded; nothing is written to disk.
 */
import { NextResponse } from "next/server";
import { sttProviderFromEnv, transcribe } from "@/lib/voice/server/providers";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form data" }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) return NextResponse.json({ error: "audio is required" }, { status: 400 });
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: "audio too large" }, { status: 413 });

  const provider = sttProviderFromEnv();
  try {
    const transcript = await transcribe(audio, provider);
    return NextResponse.json({ provider, transcript });
  } catch (err) {
    console.error("[api/stt]", err);
    return NextResponse.json({ error: "transcription failed" }, { status: 502 });
  }
}
