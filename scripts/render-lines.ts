/**
 * Pre-render every teacher line of a lesson into static audio + viseme tracks.
 *
 *   npm run render-lines                                  # provider from env (mock if no keys)
 *   npm run render-lines -- --provider mock               # offline: silent clips, estimated lips
 *   npm run render-lines -- --provider elevenlabs --names "سلمان,ليان,محمد"
 *   npm run render-lines -- --lesson fractions --force    # re-render one lesson (default: all registered lessons)
 *
 * Output: public/audio/<lessonId>/<hash>.<ext> + manifest.json. Lines whose
 * text and voice are unchanged are skipped, so re-running after a copy edit
 * only renders the edited lines. Keys come from .env.local (see .env.example).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { LESSON_LIST, getLesson, type LessonDefinition } from "@/lib/lesson-engine";
import { extractTeacherLines, type LinesManifest, type ManifestLine } from "@/lib/voice/lines";
import { synthesize, ttsConfigFromEnv, type TtsProvider } from "@/lib/voice/server/providers";

interface Args {
  lesson: string;
  provider?: TtsProvider;
  names: string[];
  out: string;
  force: boolean;
  voice?: string;
  model?: string;
  /** Exit 0 without rendering when no real TTS provider is configured (build hook). */
  ifConfigured: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { lesson: "all", names: ["سلمان"], out: "public/audio", force: false, ifConfigured: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--lesson") args.lesson = next();
    else if (a === "--provider") args.provider = next() as TtsProvider;
    else if (a === "--names") args.names = next().split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--out") args.out = next();
    else if (a === "--voice") args.voice = next();
    else if (a === "--model") args.model = next();
    else if (a === "--force") args.force = true;
    else if (a === "--if-configured") args.ifConfigured = true;
    else if (a === "--help" || a === "-h") {
      console.log("usage: render-lines [--lesson id] [--provider elevenlabs|openai|mock] [--names a,b] [--voice id] [--model id] [--out dir] [--force]");
      process.exit(0);
    } else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

const EXT: Record<string, string> = { "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg" };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets: LessonDefinition[] = args.lesson === "all" ? LESSON_LIST : [];
  if (args.lesson !== "all") {
    const one = getLesson(args.lesson);
    if (!one) throw new Error(`unknown lesson: ${args.lesson}`);
    targets.push(one);
  }
  let failedTotal = 0;
  for (const lesson of targets) failedTotal += await renderLesson(lesson, args);
  // As a build hook, never fail the deploy: missing clips fall back to the device voice at runtime.
  if (failedTotal && !args.ifConfigured) process.exit(1);
  if (failedTotal) console.warn("render-lines: some lines failed; the app will use the device voice for them");
}

/** Render one lesson; returns the number of failed lines. */
async function renderLesson(lesson: LessonDefinition, args: Args): Promise<number> {
  const cfg = ttsConfigFromEnv();
  if (args.provider) cfg.provider = args.provider;
  if (args.ifConfigured && cfg.provider === "mock") {
    console.log("render-lines: no TTS provider configured, skipping (simulated voice will be used)");
    return 0;
  }
  if (args.voice) cfg.voice = args.voice;
  if (args.model) cfg.model = args.model;
  if (cfg.provider === "mock") cfg.voice = "silence";

  const dir = path.join(process.cwd(), args.out, lesson.id);
  await mkdir(dir, { recursive: true });
  const manifestFile = path.join(dir, "manifest.json");

  let previous: LinesManifest | null = null;
  try {
    previous = JSON.parse(await readFile(manifestFile, "utf8")) as LinesManifest;
  } catch {
    /* first run */
  }
  const sameVoice =
    previous && previous.voice.provider === cfg.provider && previous.voice.voice === cfg.voice && previous.voice.model === cfg.model;

  const lines = extractTeacherLines(lesson, args.names);
  const manifest: LinesManifest = {
    version: 1,
    lessonId: lesson.id,
    voice: { provider: cfg.provider, voice: cfg.voice, model: cfg.model },
    renderedAt: new Date().toISOString(),
    lines: {},
  };

  console.log(`${lesson.id}: ${lines.length} lines · provider ${cfg.provider} · voice ${cfg.voice} · model ${cfg.model}`);
  let rendered = 0;
  let skipped = 0;
  let failed = 0;
  for (const line of lines) {
    const prev = sameVoice && !args.force ? previous!.lines[line.hash] : undefined;
    if (prev) {
      manifest.lines[line.hash] = prev;
      skipped++;
      continue;
    }
    try {
      const s = await synthesize(line.text, cfg);
      const file = `${line.hash}.${EXT[s.mime] ?? "bin"}`;
      await writeFile(path.join(dir, file), s.audio);
      const entry: ManifestLine = { id: line.id, text: line.text, file, mime: s.mime, durationMs: s.durationMs, visemes: s.visemes };
      manifest.lines[line.hash] = entry;
      rendered++;
      console.log(`  ✓ ${line.id.padEnd(12)} ${String(s.durationMs).padStart(5)}ms ${s.aligned ? "aligned" : "estimated"}  ${line.text.slice(0, 48)}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${line.id}: ${(err as Error).message}`);
    }
  }
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  console.log(`done: ${rendered} rendered, ${skipped} unchanged, ${failed} failed → ${path.relative(process.cwd(), manifestFile)}`);
  return failed;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
