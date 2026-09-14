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
lib/lesson-engine/
  types.ts                    # lesson JSON + session state types
  fractions.lesson.json       # the live lesson: steps, choices, copy (verbatim from the design)
  reducer.ts                  # pure state machine over the step graph
  selectors.ts                # progress dots, observation notes, rating, summary stats
  contract.ts                 # TurnState / ModelTurn JSON contracts + validator
  prompts.ts                  # system/turn prompt builders for the live model
  timing.ts                   # speaking / pause / thinking / recording timings
  useLessonSession.ts         # client runtime: timers + voice adapter around the reducer
lib/voice/                    # VoiceAdapter interface, simulated adapter, realtime stub, TTS fallback
lib/store/                    # app store (localStorage), parent gate
lib/content/catalog.ts        # subjects, lesson paths, parent-area copy
lib/analytics/events.ts       # event buffer + sink hook
lib/db/supabase.ts            # persistence stub
```

## Lesson engine

The LLM never free-runs. `fractions.lesson.json` defines the step graph; `reducer.ts` walks it and keeps the
per-turn state (`concept`, `difficulty`, `attempts`, `understanding`, `strategy`). Every adaptation appends a
human-readable log line that feeds the end screen, the parent summary and analytics.

Voice is simulated for now (`SimulatedVoiceAdapter`): speaking lasts `max(1800ms, 55ms × chars)`, the mic
records for 1800ms and returns the scripted "correct" answer. `lib/voice/realtime.ts` is the stub for
Gemini Live / OpenAI Realtime; the runtime only needs `speak()` to resolve on the TTS end event, `listen()` to
resolve with a transcript, and `interrupt()` for barge-in.
