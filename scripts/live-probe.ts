/**
 * One-command check of a Gemini key against the Live API, without the app:
 *
 *   npm run live:probe                          # gemini-3.1-flash-live-preview, ephemeral token, v1beta socket
 *   npm run live:probe -- --auth key            # connect with the API key instead of a token (control)
 *   npm run live:probe -- --model gemini-2.5-flash-native-audio-latest --ws v1alpha
 *
 * Prints whether the token was minted, whether the socket completed setup,
 * and the teacher's greeting transcript and audio length. Reads
 * GEMINI_API_KEY from .env.local.
 */
import { askSystemPrompt } from "@/lib/lesson-engine/prompts";
import { getLesson } from "@/lib/lesson-engine";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1] ?? "");
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("GEMINI_API_KEY is not set (put it in .env.local)");
  process.exit(1);
}
const model = args.get("model") || process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
const wsVersion = args.get("ws") || process.env.GEMINI_LIVE_API_VERSION || "v1beta";
const auth = args.get("auth") || "token";
const lesson = getLesson("fractions")!;
const redact = (s: string) => s.split(key).join("[key]");

const setup = {
  model: `models/${model}`,
  generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: process.env.GEMINI_LIVE_VOICE || "Kore" } } } },
  systemInstruction: { parts: [{ text: askSystemPrompt(lesson, "سلمان") }] },
  inputAudioTranscription: {},
  outputAudioTranscription: {},
};

async function main() {
  let credential = `key=${key}`;
  if (auth === "token") {
    const now = Date.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/auth_tokens?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + 180_000).toISOString(),
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        bidiGenerateContentSetup: setup,
      }),
    });
    const json = (await res.json()) as { name?: string };
    console.log(`token: ${res.status} ${res.ok ? "minted with the full locked setup" : redact(JSON.stringify(json)).slice(0, 300)}`);
    if (!res.ok || !json.name) process.exit(1);
    credential = `access_token=${encodeURIComponent(json.name)}`;
  }

  const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${wsVersion}.GenerativeService.BidiGenerateContent?${credential}`;
  console.log(`socket: ${wsVersion} · auth ${auth} · model ${model}`);
  const ws = new WebSocket(url);
  const t0 = Date.now();
  const log = (...a: unknown[]) => console.log(`${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s`, ...a);
  let audioBytes = 0;
  let transcript = "";
  let setupDone = false;
  let turns = 0;

  const finish = (code?: number, reason?: string) => {
    console.log("---");
    console.log(`setupComplete: ${setupDone} · turns: ${turns} · audio ≈ ${(audioBytes / 48000).toFixed(1)} s · greeting: ${JSON.stringify(transcript)}`);
    if (code !== undefined) console.log(`closed ${code} ${redact(reason ?? "")}`);
    process.exit(setupDone && turns > 0 ? 0 : 1);
  };

  ws.onopen = () => {
    log("open → setup");
    ws.send(JSON.stringify({ setup }));
  };
  ws.onmessage = async (e) => {
    const raw = typeof e.data === "string" ? e.data : await (e.data as Blob).text();
    const m = JSON.parse(raw) as {
      setupComplete?: unknown;
      serverContent?: { modelTurn?: { parts?: { inlineData?: { data?: string } }[] }; outputTranscription?: { text?: string }; turnComplete?: boolean };
    };
    if (m.setupComplete !== undefined) {
      setupDone = true;
      log("setupComplete → kickoff");
      ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "(الطفل جاهز ويسمعك الآن. ابدأ بالترحيب.)" }] }], turnComplete: true } }));
      const silence = Buffer.alloc(3200).toString("base64");
      let n = 0;
      const iv = setInterval(() => {
        if (ws.readyState === 1 && n++ < 30) ws.send(JSON.stringify({ realtimeInput: { audio: { data: silence, mimeType: "audio/pcm;rate=16000" } } }));
        else clearInterval(iv);
      }, 100);
      return;
    }
    const sc = m.serverContent;
    if (!sc) return;
    for (const p of sc.modelTurn?.parts ?? []) if (p.inlineData?.data) audioBytes += Buffer.from(p.inlineData.data, "base64").length;
    if (sc.outputTranscription?.text) transcript += sc.outputTranscription.text;
    if (sc.turnComplete) {
      turns++;
      log(`turnComplete · audio ≈ ${(audioBytes / 48000).toFixed(1)} s`);
      ws.close(1000, "done");
    }
  };
  ws.onerror = () => log("socket error");
  ws.onclose = (e) => finish(e.code, e.reason);
  setTimeout(() => {
    log("timeout");
    ws.close(1000, "timeout");
  }, 15_000);
}

main().catch((err) => {
  console.error(redact(String(err)));
  process.exit(1);
});
