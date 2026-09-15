# المعلم الذكي — AI Teacher MVP

Arabic-first (RTL), voice-first tutoring prototype for primary-school children. The teacher character
**الأستاذ نواف** explains a concept, listens to the child, assesses the answer and adapts. Parents set up the
child, hold a PIN, and get a summary.

Design handoff and HTML references live in [`docs/`](docs/README.md). This repo recreates them in
Next.js 15 + TypeScript + Tailwind v4. The visual layer follows the **v2 hand-drawn restyle** in
[`docs/README-v2.md`](docs/README-v2.md) (cream page, ink strokes, wobbly radii, flat offset shadows,
Baloo Bhaijaan 2 display type); it overrides the styling section of `docs/README.md`.

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

## Hosting (school.mvp.sa / learn.mvp.sa)

The app is served from **school.mvp.sa**; **learn.mvp.sa** is an alias that 308-redirects to it with the
path preserved (`ALIAS_HOSTS` in `lib/site.ts`, wired in `next.config.ts`). Both are attached to the
`ai-teacher` Vercel project; the `ai-teacher-delta-one.vercel.app` URL keeps working for previews.

DNS (`mvp.sa` is on Cloudflare; the apex is already verified on the Vercel account):

| Record | Name | Value | Proxy |
| --- | --- | --- | --- |
| A | `school` | `76.76.21.21` | DNS only |
| A | `learn` | `76.76.21.21` | DNS only |

Vercel issues the certificates once the records resolve. `NEXT_PUBLIC_SITE_URL` sets the origin used by
`metadataBase`, the canonical link, Open Graph and `sitemap.xml`; `robots.txt` keeps `/api`, `/dev`,
`/parent` and the lesson runtime out of search results.

## Children, settings and history

`lib/store/state.ts` holds a household: `children[]` (name, age, grade, avatar colour, per-child settings,
finished-session history) and `activeChildId`, persisted under `ai-teacher:v2` with a migration from the
v1 single-child record. Per-child settings: daily minutes, reminder, open conversation, `sound`
(`voice` | `reading`) and `startLevel`. The profiles screen switches child; the parent area edits, adds and
removes children and shows this week's numbers computed from their history (`lib/store/insights.ts`).

## Lessons and levels

Seven lessons ship across the four subjects: الكسور (the original graph), الجمع والطرح, القياس, دورة الماء,
الحواس الخمس, التنوين and أركان الإسلام. All but the first use
**question pools**: a step with `"pool": "<concept>"` draws a question from `lesson.pools[concept][level - 1]`
(first unasked, else the nearest lower level) and keeps drawing until its `askCount` correct answers. Answers on
pool steps run the adaptation policy in `lib/lesson-engine/policy.ts`: two correct in a row raise the level (with
the `levelUpAdapt` note), two wrong in a row lower it and route to the step's `onLevelDown`. A session starts at
the parent's start level or where the child's last session of that lesson ended, whichever is higher
(`continueLevel` in `lib/store/insights.ts`); the parent area shows the level and correct ratio per lesson.

## Parent accounts and sync (Convex)

`convex/` holds the backend, modelled on careers.sa: email-code sign-in (`authEmail.ts` + `authEmailDb.ts`:
6-digit code, sha256 at rest, 10-minute expiry, 60 s cooldown, ≤3 sends / 10 min, ≤8 attempts), a household
per email with bearer sessions, and `household.ts` (`me`, `sync`, `removeChild`, `setDigest`, `exportData`,
`deleteAccount`, `signOut`). `digest.ts` + `crons.ts` send a weekly summary (Sunday 09:00 Riyadh) to households
that opted in and had a session that week, using the same numbers as the parent area.

The app is local-first: the device keeps its household in localStorage and, when signed in, `lib/convex/account.tsx`
merges the account copy in (children by id, newer edit wins; sessions by lesson + start time) and pushes local
changes after a short debounce (`lib/store/merge.ts`, tested). Without `NEXT_PUBLIC_CONVEX_URL` everything
still works and the account section is hidden.

Setup: `npx convex dev` once to create the project (writes the URL into `.env.local`), then on the deployment
`npx convex env set SMTP_HOST smtp.improvmx.com`, `SMTP_PORT 587`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`,
`APP_URL`; `npx convex deploy` for production and set `NEXT_PUBLIC_CONVEX_URL` on Vercel to the prod URL.
`DEMO_AUTH=1` on a dev deployment shows the code on screen instead of emailing it.

## Admin page and demo gate

`/admin` (not linked, `robots` disallows it) shows who tried the app and lets you close the demo. Sign in with the
same email-code flow as parents; only emails listed in the Convex env `ADMIN_EMAILS` (comma-separated,
`npx convex env set ADMIN_EMAILS you@example.com --prod`) see the data.

- **Usage** comes from `events` rows every device sends through `convex/telemetry.ts` (`lib/telemetry/client.tsx`):
  one `visit` per browser session, `first_visit` the first time a device is seen, a `page` per route change,
  `onboarded`, `lesson_start` and `lesson_end`. A random device id, a path, a referrer host and mobile/desktop;
  no names, emails or transcripts. `lib/telemetry/aggregate.ts` turns them into the 7/30/90-day numbers,
  the daily bars, and the lesson, page and referrer lists (days cut at Riyadh midnight).
- **Accounts** lists signed-in parents with their synced children and sessions, plus the last saved sessions.
- **Gate** (`convex/gate.ts`, `components/Gate.tsx`): `open` (default), `code` (visitors type an access code once
  per device, stored in `localStorage`) or `closed` (message plus the contact link). Changing it applies to every
  visitor immediately; `/admin` itself is never gated. Without a Convex URL there is no gate and no telemetry.

## Adding a lesson

1. Write `lib/lessons/<subject>/<id>.lesson.json` (same shape as the existing lessons). A step's `visual` is
   either a parametric spec (`pizza`, `fractions`, `chocolate`, `compare`, `blocks`, `numberline`, `ruler`,
   `balance`, `cycle`, `word`, `cards`; see `lib/lesson-engine/visuals.ts`) or one of the fractions-era ids. Pool steps take
   `pool`, `askCount`, `onOk`, `onWrong`, `onLevelDown`; each pool question has `id`, `text`, `visual`, `choices`.
2. Register it in `lib/lessons/index.ts` and give the catalog entry its `lessonId`.
3. `npm test`: `lib/lessons/lessons.test.ts` validates every registered graph (targets, choice sets,
   reachability, visuals) so a broken lesson never reaches a child.
4. `npm run render-lines -- --lesson <id>` (or plain `npm run render-lines` for every lesson) and commit the audio.

## Session query flags

| Flag | Effect |
| --- | --- |
| `?demo=1` | Show the demo controls panel (4 child paths). Also shown in development, or after tapping the teacher avatar 5 times. |
| `?pace=fast` | Multiply all timings by 0.45. |
| `?engine=1` | Show live engine-state chips and JSON in the demo panel. |

## Visual system (v2)

- No frame, header bar or footer bar: the cream page is the surface. Corner chrome only (`AppHeader`: back +
  wordmark, parent pill + child initial); the session draws its own row.
- Tokens live in `app/globals.css` (`@theme` colors/shadows/animations, `@utility` wobbly radii `r-btn-*`,
  `r-card-*`, `r-avatar`, `r-pizza`, `r-dot`, ink strokes `ink` / `ink-2`, `hatch`, `press`).
- `components/Sketch.tsx` holds the primitives: `SketchButton`, `SketchCard`, `SketchCircle`, `SketchChip`,
  `SketchPill`, `SketchLink`, `DashedRule`. Siblings cycle the radius via `index`.
- Fractions are hatched once per shape (`components/visuals/Pizza.tsx`: single hatch layer + cream quadrant
  masks; props `filled` 0–4, `dividers` `none|v|vh`).
- Footer and brand content come from `lib/site.ts` (mirror of `docs/site-config.js`): `<Footer variant="full">`
  on the landing, `"slim"` on the parent page, `<PoweredBy>` on the child home. Never hard-code links.
- `NEXT_PUBLIC_GUIDED_DEMO` (default `false`): set it to `true` to hide the subject library on the child home
  behind an "استعرض كل المواد" link (investor demo). The library is always reachable from the "المواد" header link
  and `/subjects`.
- The teacher's look (`lib/character/looks.ts`: classic, shemagh, ghutra, young) is a per-child setting picked in
  onboarding or the parent area; `<Teacher>` reads it from the store, `look` prop overrides.

## Structure

```
app/                          # routes (RTL layout, IBM Plex Sans Arabic)
components/                   # Frame, AppHeader, Sketch, Footer, PoweredBy, Teacher, Waveform, Keypad, …
components/visuals/           # Pizza, Chocolate, CompareCircles, FractionGlyph
components/session/           # InteractionBar, MicButton, Choices, AdaptChip, DemoControls, SessionView
components/character/         # Character switch, NawafSvg rig, RiveTeacher binding
lib/character/contract.ts     # state / viseme / level input contract shared with the .riv file
app/dev/character/            # rig preview page
lib/lessons/                  # lesson registry: <subject>/<id>.lesson.json + index.ts; validate.ts checks every graph
lib/lesson-engine/
  types.ts                    # lesson JSON + session state types (VisualSpec: parametric visuals)
  visuals.ts                  # visual kinds, the fractions-era id aliases, validator helpers
  policy.ts                   # adaptation thresholds, start level, level clamping
  reducer.ts                  # pure state machine over the step graph
  selectors.ts                # progress dots, observation notes, rating, summary stats
  contract.ts                 # TurnState / ModelTurn JSON contracts + validator
  prompts.ts                  # system/turn prompt builders for the live model
  timing.ts                   # speaking / pause / thinking / recording timings
  useLessonSession.ts         # client runtime: timers + voice adapter around the reducer
lib/voice/                    # VoiceAdapter interface, silent (timer / reading) + cascaded adapters, realtime stub
lib/voice/lines.ts            # teacher-line extraction, hashing, Arabic letter → viseme mapping
lib/voice/server/             # TTS / STT / assessment providers used by scripts and route handlers
scripts/render-lines.ts       # pre-render teacher audio + viseme tracks into public/audio/
app/api/{tts,stt,assess}/     # route handlers; vendor keys stay server-side
lib/store/                    # app store v2 (household of children, per-child settings + history), insights, merge, parent gate
lib/convex/                   # Convex client config/provider and the account + sync hook
convex/                       # Convex backend: schema, email-code auth, household sync, weekly digest cron
lib/content/catalog.ts        # subjects, lesson paths, parent-area copy
lib/site.ts                   # footer links, socials, powered-by (from docs/site-config.js)
lib/flags.ts                  # NEXT_PUBLIC_GUIDED_DEMO
lib/analytics/events.ts       # event buffer + sink hook
lib/store/merge.ts            # device ↔ account reconciliation (pure, tested)
```

## Voice pipeline

Two adapters implement `lib/voice/types.ts`. `cascaded` is the default; force the silent timer prototype with
`?voice=simulated` or `NEXT_PUBLIC_VOICE=simulated`. `?voice=reading` (or the child's "وضع القراءة" setting)
runs the lesson without sound: the sentence stays on screen until the child taps التالي, and free answers
become tap buttons.

| Adapter | Teacher speech | Child answer |
| --- | --- | --- |
| `cascaded` (default) | pre-rendered clips from `public/audio/<lesson>/` → `/api/tts` → the device's Arabic voice (SpeechSynthesis) → timers | Web Speech API recognition (Chrome, Safari, Android) → else push-to-talk recording → `/api/stt`; then `/api/assess` → engine branch; on any failure the four scripted answers become tap choices |
| `simulated` | timers: `max(1800ms, 55ms × chars)` | 1.8 s fake recording, scripted "correct" |
| `reading` | waits for التالي (no sound) | no mic; the scripted answers are buttons |

With no keys at all the app still speaks and listens through the browser. Because browsers only play audio after a
user gesture, the session shows its start screen after a deep link or reload, and the explanation mode shows
"ابدأ الشرح".

Pre-render the teacher lines once per voice (copy `.env.example` to `.env.local` first):

```bash
npm run render-lines -- --provider mock                 # offline: silent clips, estimated lips
npm run render-lines -- --provider elevenlabs --names "سلمان,ليان"   # real voice + character timestamps
npm run render-lines -- --provider openai --force
```

The script walks every registered lesson, fills `{name}` for each name, hashes each line, and skips lines whose
text and voice are unchanged. ElevenLabs renders on `eleven_multilingual_v2` (the quality model for Arabic) with a
steady, slightly slow teacher delivery (`ELEVENLABS_STABILITY` / `ELEVENLABS_STYLE` / `ELEVENLABS_SPEED` override it).
Premade ElevenLabs voices are English-native; a native Saudi voice from the voice library needs a paid ElevenLabs
plan for API use. If a line fails to render, the previous clip is kept so the lesson never drops to the device voice. The manifest maps `hash → {file, durationMs, visemes}`; the adapter looks up the
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

The LLM never free-runs. The lesson JSON in `lib/lessons/` defines the step graph; `reducer.ts` walks it and keeps the
per-turn state (`concept`, `difficulty`, `attempts`, `understanding`, `strategy`). Every adaptation appends a
human-readable log line that feeds the end screen, the parent summary and analytics.

`lib/voice/realtime.ts` remains the stub for a future Gemini Live / OpenAI Realtime moment; the runtime only
needs `speak()` to resolve on the audio end event, `listen()` to resolve with a transcript and kind, and
`interrupt()` for barge-in.
