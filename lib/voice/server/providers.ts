/**
 * Server-side voice providers, shared by scripts/render-lines.ts and the
 * route handlers under app/api. Plain fetch, no vendor SDKs, so the same
 * code runs in Node and in the Next.js runtime. API keys never leave here.
 */
import { parseModelTurn, type ModelTurn, type TurnState } from "@/lib/lesson-engine/contract";
import type { IntroAnswerKind } from "@/lib/lesson-engine/types";
import { speakDuration } from "@/lib/lesson-engine/timing";
import { systemPrompt, turnPrompt } from "@/lib/lesson-engine/prompts";
import type { LessonDefinition } from "@/lib/lesson-engine/types";
import { estimateAlignment, visemesFromAlignment, type CharAlignment } from "../lines";
import type { VisemeFrame } from "../types";
import { silentWav, wavDurationMs } from "./wav";

export type TtsProvider = "elevenlabs" | "openai" | "mock";
export type SttProvider = "openai" | "mock";
export type AssessProvider = "openai" | "heuristic";

/** Loosely typed env so tests can pass plain objects. */
export type Env = Record<string, string | undefined>;

export interface Synthesized {
  audio: Uint8Array;
  mime: string;
  durationMs: number;
  visemes: VisemeFrame[];
  /** True when the visemes came from real timestamps rather than an estimate. */
  aligned: boolean;
}

export interface TtsConfig {
  provider: TtsProvider;
  voice: string;
  model: string;
}

export function ttsConfigFromEnv(env: Env = process.env): TtsConfig {
  const provider = (env.TTS_PROVIDER as TtsProvider) || (env.ELEVENLABS_API_KEY ? "elevenlabs" : env.OPENAI_API_KEY ? "openai" : "mock");
  if (provider === "elevenlabs") {
    return { provider, voice: env.ELEVENLABS_VOICE_ID || "", model: env.ELEVENLABS_MODEL || "eleven_flash_v2_5" };
  }
  if (provider === "openai") {
    return { provider, voice: env.OPENAI_TTS_VOICE || "coral", model: env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts" };
  }
  return { provider: "mock", voice: "silence", model: "estimate" };
}

export async function synthesize(text: string, cfg: TtsConfig, env: Env = process.env): Promise<Synthesized> {
  switch (cfg.provider) {
    case "elevenlabs":
      return elevenlabsSynthesize(text, cfg, requireEnv(env, "ELEVENLABS_API_KEY"));
    case "openai":
      return openaiSynthesize(text, cfg, requireEnv(env, "OPENAI_API_KEY"));
    default:
      return mockSynthesize(text);
  }
}

/** Silent clip with the design's timing, so the pipeline runs offline. */
export function mockSynthesize(text: string): Synthesized {
  const durationMs = speakDuration(text);
  return {
    audio: silentWav(durationMs),
    mime: "audio/wav",
    durationMs,
    visemes: visemesFromAlignment(estimateAlignment(text, durationMs), durationMs),
    aligned: false,
  };
}

/** ElevenLabs with character timestamps → real viseme track. */
async function elevenlabsSynthesize(text: string, cfg: TtsConfig, apiKey: string): Promise<Synthesized> {
  if (!cfg.voice) throw new Error("ELEVENLABS_VOICE_ID is required");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: cfg.model, language_code: "ar" }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    audio_base64: string;
    alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
  };
  const audio = Uint8Array.from(Buffer.from(json.audio_base64, "base64"));
  const al = json.alignment;
  const alignment: CharAlignment | null = al ? { chars: al.characters, starts: al.character_start_times_seconds } : null;
  const durationMs = al ? Math.round(Math.max(...al.character_end_times_seconds) * 1000) : speakDuration(text);
  return {
    audio,
    mime: "audio/mpeg",
    durationMs,
    visemes: visemesFromAlignment(alignment ?? estimateAlignment(text, durationMs), durationMs),
    aligned: !!alignment,
  };
}

/** OpenAI TTS (no timestamps): WAV so we can read the real duration; visemes are estimated. */
async function openaiSynthesize(text: string, cfg: TtsConfig, apiKey: string): Promise<Synthesized> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      voice: cfg.voice,
      input: text,
      response_format: "wav",
      instructions: "معلم ابتدائي سعودي، هادئ ودافئ، يتكلم ببطء وبوضوح مع طفل.",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
  const audio = new Uint8Array(await res.arrayBuffer());
  const durationMs = wavDurationMs(audio) || speakDuration(text);
  return {
    audio,
    mime: "audio/wav",
    durationMs,
    visemes: visemesFromAlignment(estimateAlignment(text, durationMs), durationMs),
    aligned: false,
  };
}

/* ---------------------------------------------------------------------- */
/* Speech to text                                                          */
/* ---------------------------------------------------------------------- */

export function sttProviderFromEnv(env: Env = process.env): SttProvider {
  return (env.STT_PROVIDER as SttProvider) || (env.OPENAI_API_KEY ? "openai" : "mock");
}

export async function transcribe(audio: Blob, provider: SttProvider, env: Env = process.env): Promise<string> {
  if (provider === "mock") return "";
  const form = new FormData();
  form.append("file", audio, "answer.webm");
  form.append("model", env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe");
  form.append("language", "ar");
  form.append("prompt", "طفل سعودي يجيب معلمه عن سؤال في الكسور: النصف، الربع، جزأين، أربع قطع.");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${requireEnv(env, "OPENAI_API_KEY")}` },
    body: form,
  });
  if (!res.ok) throw new Error(`OpenAI STT ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

/* ---------------------------------------------------------------------- */
/* Assessment → ModelTurn                                                  */
/* ---------------------------------------------------------------------- */

export interface AssessInput {
  transcript: string;
  teacherLine: string;
  turnState: TurnState;
  childName: string;
  lesson: LessonDefinition;
}

export function assessProviderFromEnv(env: Env = process.env): AssessProvider {
  return (env.ASSESS_PROVIDER as AssessProvider) || (env.OPENAI_API_KEY ? "openai" : "heuristic");
}

export async function assess(input: AssessInput, provider: AssessProvider, env: Env = process.env): Promise<ModelTurn> {
  if (provider === "heuristic") return heuristicAssess(input);
  try {
    return await openaiAssess(input, requireEnv(env, "OPENAI_API_KEY"), env.OPENAI_ASSESS_MODEL || "gpt-4o-mini");
  } catch (err) {
    console.warn("[assess] model call failed, using heuristic:", err);
    return heuristicAssess(input);
  }
}

const MODEL_TURN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    assessment: { type: "string", enum: ["understood", "confused", "wrong", "strong"] },
    next_action: { type: "string", enum: ["continue", "re_explain", "different_example", "retry", "increase_difficulty"] },
    difficulty_change: { type: "integer", enum: [-1, 0, 1] },
    teaching_strategy: { type: "string" },
    visual: {
      type: "string",
      enum: ["pizzaHalf", "pizza34", "fractions", "fractions34", "chocOne", "chocPick", "chocTwo", "compare", "comparePick"],
    },
    response: { type: "string" },
  },
  required: ["assessment", "next_action", "difficulty_change", "teaching_strategy", "visual", "response"],
} as const;

async function openaiAssess(input: AssessInput, apiKey: string, model: string): Promise<ModelTurn> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt(input.lesson, input.childName) },
        { role: "user", content: turnPrompt(input.turnState, input.teacherLine, input.transcript) },
      ],
      response_format: { type: "json_schema", json_schema: { name: "model_turn", strict: true, schema: MODEL_TURN_SCHEMA } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI assess ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return parseModelTurn(json.choices[0]?.message?.content ?? "");
}

/**
 * Keyword assessment for offline development and as a safety net. Tuned to
 * the intro question ("تعرف وش يعني النصف؟") and Gulf-dialect phrasing.
 */
export function heuristicAssess(input: AssessInput): ModelTurn {
  const t = input.transcript.replace(/[ً-ْ]/g, "").toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  const dontKnow = !t.trim() || has("ما اعرف", "ما أعرف", "مدري", "ما ادري", "لا اعرف", "لا أعرف", "معرف");
  const unsure = has("مو متاكد", "مو متأكد", "امم", "يمكن", "يعني…", "ما فهمت");
  const half = has("نصين", "جزأين", "جزئين", "قسمين", "اثنين", "اثنتين", "٢", "2", "نص", "نصف");
  const quarter = has("ربع", "اربع", "أربع", "٤", "4");
  const wrong = has("ثلاث", "خمس", "كله", "الكل");

  let assessment: ModelTurn["assessment"];
  if (dontKnow) assessment = "confused";
  else if (half && quarter) assessment = "strong";
  else if (half && !wrong) assessment = "understood";
  else if (unsure) assessment = "confused";
  else assessment = "wrong";

  const map: Record<ModelTurn["assessment"], Omit<ModelTurn, "assessment">> = {
    understood: { next_action: "continue", difficulty_change: 0, teaching_strategy: "pizza_visual", visual: "pizzaHalf", response: "" },
    strong: { next_action: "increase_difficulty", difficulty_change: 1, teaching_strategy: "pizza_visual", visual: "fractions", response: "" },
    confused: { next_action: "different_example", difficulty_change: -1, teaching_strategy: "chocolate_visual", visual: "chocOne", response: "" },
    wrong: { next_action: "re_explain", difficulty_change: 0, teaching_strategy: "chocolate_visual", visual: "chocOne", response: "" },
  };
  return { assessment, ...map[assessment] };
}

const DONT_KNOW = ["ما اعرف", "ما أعرف", "مدري", "ما ادري", "لا اعرف", "لا أعرف", "معرف"];

/**
 * The engine's intro branches are keyed by IntroAnswerKind. `confused` and
 * `wrong` both lead to the chocolate re-explanation; the transcript decides
 * which log line the parent sees ("لم يفهم" vs "لم تكن إجابته واضحة").
 */
export function modelTurnToIntroKind(turn: ModelTurn, transcript = ""): IntroAnswerKind {
  switch (turn.assessment) {
    case "understood":
      return "correct";
    case "strong":
      return "strong";
    case "confused":
    case "wrong":
    default: {
      const t = transcript.replace(/[\u064b-\u0652]/g, "");
      return !t.trim() || DONT_KNOW.some((w) => t.includes(w)) ? "dontknow" : "unclear";
    }
  }
}

function requireEnv(env: Env, key: string): string {
  const v = env[key];
  if (!v) throw new Error(`${key} is not set`);
  return v;
}
