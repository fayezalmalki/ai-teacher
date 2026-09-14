# المعلم الذكي — AI Teacher MVP

Arabic-first (RTL), voice-first tutoring prototype for primary-school children. The teacher character
**الأستاذ نواف** explains a concept, listens to the child, assesses the answer and adapts. Parents set up the
child, hold a PIN, and get a summary.

Design handoff and HTML references live in [`docs/`](docs/README.md). This repo recreates them in
Next.js 15 + TypeScript + Tailwind v4.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm test           # lesson-engine state machine tests (vitest)
npm run typecheck && npm run lint
```

Prototype parent PIN is `1234` until onboarding sets a new one. Profile, PIN, settings and the last session
result persist in `localStorage`.

## Journeys

- `/` landing → **ابدأ الإعداد** → `/onboarding` (3 steps) → `/home`
- `/` → **ادخل كطالب** → `/profiles` → `/home`
- `/home` → `/lesson/fractions` → **اشرح لي أول** `/lesson/fractions/explain` or **ودّي أجرب مباشرة**
  `/lesson/fractions/session` → end screen → `/lesson/fractions/summary`
- `/` → **جرّب درس الكسور مع الأستاذ نواف الآن** → straight into the session (one tap)
- **ولي الأمر** → `/parent/pin` → `/parent`

## Session query flags

| Flag | Effect |
| --- | --- |
| `?demo=1` | Show the demo controls panel (4 child paths). Also shown in development, or after tapping the teacher avatar 5 times. |
| `?pace=fast` | Multiply all timings by 0.45. |
| `?engine=1` | Show live engine-state chips and JSON in the demo panel. |

## Structure

```
app/                          # routes (RTL layout, IBM Plex Sans Arabic)
components/                   # Frame, AppHeader, Teacher, Waveform, StatusPill, Keypad, …
components/visuals/           # Pizza, Chocolate, CompareCircles, FractionGlyph
components/session/           # InteractionBar, MicButton, Choices, AdaptChip, DemoControls, SessionView
components/character/         # Character switch, NawafSvg rig, RiveTeacher binding
lib/character/contract.ts     # state / viseme / level input contract shared with the .riv file
app/dev/character/            # rig preview page
lib/lesson-engine/
  types.ts                    # lesson JSON + session state types
  fractions.lesson.json       # the live lesson: steps, choices, copy (verbatim from the design)
  reducer.ts                  # pure state machine over the step graph
  selectors.ts                # progress dots, observation notes, rating, summary stats
  contract.ts                 # TurnState / ModelTurn JSON contracts + validator
  prompts.ts                  # system/turn prompt builders for the live model
  timing.ts                   # speaking / pause / thinking / recording timings
  useLessonSession.ts         # client runtime: timers + voice adapter around the reducer
lib/voice/                    # VoiceAdapter interface, simulated + cascaded adapters, realtime stub
lib/voice/lines.ts            # teacher-line extraction, hashing, Arabic letter → viseme mapping
lib/voice/server/             # TTS / STT / assessment providers used by scripts and route handlers
scripts/render-lines.ts       # pre-render teacher audio + viseme tracks into public/audio/
app/api/{tts,stt,assess}/     # route handlers; vendor keys stay server-side
lib/store/                    # app store (localStorage), parent gate
lib/content/catalog.ts        # subjects, lesson paths, parent-area copy
lib/analytics/events.ts       # event buffer + sink hook
lib/db/supabase.ts            # persistence stub
```

## Voice pipeline

Two adapters implement `lib/voice/types.ts`. `cascaded` is the default; force the silent timer prototype with
`?voice=simulated` or `NEXT_PUBLIC_VOICE=simulated`.

| Adapter | Teacher speech | Child answer |
| --- | --- | --- |
| `cascaded` (default) | pre-rendered clips from `public/audio/<lesson>/` → `/api/tts` → the device's Arabic voice (SpeechSynthesis) → timers | Web Speech API recognition (Chrome, Safari, Android) → else push-to-talk recording → `/api/stt`; then `/api/assess` → engine branch; on any failure the four scripted answers become tap choices |
| `simulated` | timers: `max(1800ms, 55ms × chars)` | 1.8 s fake recording, scripted "correct" |

With no keys at all the app still speaks and listens through the browser. Because browsers only play audio after a
user gesture, the session shows its start screen after a deep link or reload, and the explanation mode shows
"ابدأ الشرح".

Pre-render the teacher lines once per voice (copy `.env.example` to `.env.local` first):

```bash
npm run render-lines -- --provider mock                 # offline: silent clips, estimated lips
npm run render-lines -- --provider elevenlabs --names "سلمان,ليان"   # real voice + character timestamps
npm run render-lines -- --provider openai --force
```

The script walks `fractions.lesson.json`, fills `{name}` for each name, hashes each line, and skips lines whose
text and voice are unchanged. The manifest maps `hash → {file, durationMs, visemes}`; the adapter looks up the
spoken text by the same hash at runtime, so a copy edit only re-renders that line. If the mic is unavailable or
nothing was heard, the session shows the four scripted answers as tap choices.

With no API keys, `/api/stt` returns an empty transcript and `/api/assess` uses a keyword heuristic, so the
cascaded path runs end-to-end offline.

## Open conversation (Gemini Live)

After the end screen, **اسأل الأستاذ نواف** opens a short full-duplex conversation: the child's voice streams to
Gemini Live, the teacher answers in audio with barge-in, and both sides are transcribed. It is a bounded detour
(2 minutes or 3 exchanges by default); the lesson engine keeps the step and logs the exchanges for the parent
summary. Parents can switch it off in the parent area.

- `app/api/live/token`: mints a single-use ephemeral token with the guardrail prompt locked into the connect
  constraints; the API key never reaches the browser.
- `lib/voice/live/gemini.ts`: raw WebSocket client (16 kHz PCM in, 24 kHz PCM out, `interrupted` → flush).
- `lib/voice/live/mock.ts`: offline stand-in used with `?live=mock` or `LIVE_PROVIDER=mock`.

Set `GEMINI_API_KEY` in `.env.local` (see `.env.example`); without it the feature runs the mock in development
and is off in production. Check a key against the Live API in one command:

```bash
npm run live:probe                 # mint an ephemeral token and open a session
npm run live:probe -- --auth key   # control: connect with the API key directly
```

The token is minted with the full setup locked under `bidiGenerateContentSetup` (the REST name; the SDK's
`liveConnectConstraints` is rejected). A key whose project answers "Your project has been denied access" on
the socket cannot use the Live API at all; that is a project-level entitlement on Google's side.

## Character

`components/Teacher.tsx` draws the circle, ring and ✓ badge; the face inside is one of three renderers that share
the contract in `lib/character/contract.ts` (five states `idle · listening · thinking · speaking · encouraging`,
an 8-value `viseme`, and the mic `level`):

| Mode | What it is | Select with |
| --- | --- | --- |
| `svg` (default) | Code-drawn rig in `components/character/NawafSvg.tsx` | `?character=svg` |
| `rive` | Designer's `public/characters/nawaf.riv` via `@rive-app/react-canvas`; falls back to `svg` when the file is missing or lacks the inputs | `?character=rive` or `NEXT_PUBLIC_CHARACTER=rive` |
| `glyph` | The original typographic "ن" | `?character=glyph` |

The rig spec for the illustrator is in [`docs/character-rig.md`](docs/character-rig.md). Preview every state,
viseme and renderer side by side at `/dev/character`, including lip-sync playback of rendered lines.

## Lesson engine

The LLM never free-runs. `fractions.lesson.json` defines the step graph; `reducer.ts` walks it and keeps the
per-turn state (`concept`, `difficulty`, `attempts`, `understanding`, `strategy`). Every adaptation appends a
human-readable log line that feeds the end screen, the parent summary and analytics.

`lib/voice/realtime.ts` remains the stub for a future Gemini Live / OpenAI Realtime moment; the runtime only
needs `speak()` to resolve on the audio end event, `listen()` to resolve with a transcript and kind, and
`interrupt()` for barge-in.
