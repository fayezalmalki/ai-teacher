# Handoff: المعلم الذكي — Working AI Teacher Prototype

## Overview
Arabic-first (RTL), voice-first tutoring experience for primary-school children. A visible teacher character, **الأستاذ نواف**, explains a concept, listens to the child, assesses the answer, and adapts (different example, simpler question, or higher difficulty). Parents set up the child, hold a PIN, and get a weekly summary with recommendations.

Test persona: **سلمان**, 9 years, grade 3. Live lesson: **الكسور** (1/2, 1/4, 3/4 and comparing them). Other subjects/lessons are shown in the library but are stubs.

## About the design files
The two `.dc.html` files (plus `support.js`) are **design references built in HTML** — they show intended look, copy and behavior. Do not ship them. Recreate them in the target stack (Next.js + TypeScript, Tailwind, see file structure below), keeping layout, copy, colors and interaction timing.

## Fidelity
**High-fidelity.** Colors, type, spacing and copy are final for the MVP. Reproduce closely; use the design tokens below.

## Files
- `المعلم الذكي — التطبيق.dc.html` — full app journey: landing, parent onboarding, child profiles, home, subject/lesson path, lesson intro, avatar explanation mode, embedded adaptive session, parent PIN, parent area.
- `المعلم الذكي.dc.html` — the adaptive session (teacher speaking/listening/thinking, three adaptive paths, end screen, parent/investor summary, demo controls). Embedded by the app via `<dc-import>` with `auto-start`.
- `support.js` — runtime for viewing the HTML references only.

Open the app file in a browser to click through. From the landing, "جرّب درس الكسور مع الأستاذ نواف الآن" jumps straight into the session (this must stay one tap from the entry screen in the real app).

---

## Journeys

### A. Parent-first
Landing → **ابدأ الإعداد** → Onboarding 1/3 (child name, age 6–12, grade 1–6) → 2/3 (4-digit parent PIN via keypad) → 3/3 done ("سلّم الجهاز لـ{name}") → **ابدأ كطالب** → Child home.

### B. Child-first
Landing → **ادخل كطالب** → Profiles ("من أنت؟": child tile + "طالب جديد" which requires parent) → Child home. Parent area is behind the PIN gate (header button "ولي الأمر").

### C. Lesson
Child home → today's lesson card (or Subject → lesson path → "درس اليوم") → Lesson intro with two choices:
- **اشرح لي أول** → Avatar explanation mode (4 steps, auto-speaks, then "نبدأ الأسئلة")
- **ودّي أجرب مباشرة** → Adaptive session directly

Adaptive session → End screen ("فهمك اليوم", 3 observations, "جرّب سؤال أخير" / "إنهاء الدرس") → Parent summary.

### D. Parent
PIN → Parent area: weekly stats, per-subject progress, last sessions, one-sentence adaptation narrative, 3 teacher recommendations, minimal settings (daily duration 10/15/20, daily reminder toggle) → "العودة لواجهة الطالب".

---

## Screens

All screens live inside one frame: `max-width 1040px`, white, `border-radius 24px`, shadow `0 1px 2px rgba(20,30,25,.04), 0 12px 40px rgba(20,30,25,.06)`, page background `#F3F4F1`, page padding 24px. Frame header: 18px 28px padding, bottom border `#EEF0EC`; contains back button (36×36, radius 12, border `#E3E6E1`), logo mark (36×36 radius 12 `#E7EFFC` with "ن" in `#2F6BD8` 700), title "المعلم الذكي" 16/600; right side: child chip (name 14px + 32px circle `#E4F3EB`/`#1F8A5B` initial) and pill button "ولي الأمر".

### 1. Landing
Padding 56px 40px 48px; sections gap 56px.
- Hero grid `repeat(auto-fit, minmax(300px,1fr))`, gap 40. Eyebrow 14/600 `#2F6BD8` "لأطفال المرحلة الابتدائية". H1 40/700 lh 1.3: "معلم يشرح لطفلك، يسمعه، ويغيّر طريقته حسب فهمه." Sub 18/400 lh 1.7 `#3D4442`: "درس قصير كل يوم مع الأستاذ نواف. صوت، أمثلة بصرية، وملخص لك بعد كل جلسة."
- Primary button "ابدأ الإعداد" (16px 28px, radius 14, `#2F6BD8`, shadow `0 8px 24px rgba(47,107,216,.25)`, hover `#2559BD`). Secondary "ادخل كطالب" (2px border `#E3E6E1`, hover bg `#F5F6F3`). Text link "جرّب درس الكسور مع الأستاذ نواف الآن ←" 15/500 `#2F6BD8` → session.
- Character: 260px circle `#E7EFFC`, inner white circle (inset 28) with "ن" 88/700 `#2F6BD8`, shadow `0 12px 32px rgba(47,107,216,.15)`, float animation 5s. Two floating pills: "خلنا نجربها بطريقة ثانية" (white, shadow) and "أنا أسمعك" (`#E4F3EB`/`#1F8A5B`).
- Three cards (`#F7F8F5`, radius 20, padding 26): يشرح / يسمع / يتكيّف with 44px numeral tiles (١ blue, ٢ green, ٣ amber `#FFF6E0`/`#8A6A1F`), title 20/600, body 15/1.65 `#3D4442`.
- "كيف تسير الجلسة": 4 pills 12px 18px radius 999 with "←" separators; last pill filled `#E7EFFC`/`#2F6BD8`.

### 2. Parent onboarding (3 steps, max-width 520, centered)
Progress: three 4px bars, filled `#2F6BD8` / `#EEF0EC`.
- Step 1 "من الطالب؟": label 14 `#3D4442`; text input 16px 18px padding, radius 14, 2px border `#E3E6E1`, focus `#2F6BD8`, 20px text. Age chips 52×48 radius 12; grade chips height 48. Selected: border+text `#2F6BD8`, bg `#E7EFFC`. Button "التالي".
- Step 2 "اختر رمزًا لولي الأمر": 4 dots 18px (`#2F6BD8` filled, `#E3E6E1` empty, `#D9534F` on error). Keypad 3×72px columns, keys 64px tall radius 16, LTR. Entering 4 digits auto-advances after 300ms.
- Step 3 "جاهز!": 96px green check circle; body "سلّم الجهاز لـ{name}. الأستاذ نواف بيبدأ بدرس قصير في الرياضيات، وبيوصلك ملخص بعدها." Buttons "ابدأ كطالب" / "عرض منطقة ولي الأمر".

### 3. Profiles
"من أنت؟" 32/700. Tiles 180px wide, padding 28 20, radius 24, 2px border; child tile has 80px initial circle (green), name 20/600, grade 13 muted. Dashed "+" tile "طالب جديد / يتطلب ولي الأمر".

### 4. Child home
Padding 40 32, gap 36. Greeting "هلا {name} 👋" 34/700 + line "عندك درس واحد اليوم، 10 دقائق مع الأستاذ نواف." 17 `#3D4442`.
- Today card: filled `#2F6BD8`, radius 24, padding 30, shadow; eyebrow 13, title "الكسور" 30/700, meta 15, white pill CTA "ابدأ مع الأستاذ نواف" (`#2F6BD8` text). 60px translucent circle with "ن".
- Last session card (`#F7F8F5`): "آخر جلسة", title 19/600, sentence with green "جيدًا جدًا", 7 day squares 26px radius 8 (`#2F6BD8` done / `#EEF0EC`), "3 أيام هذا الأسبوع".
- Subjects grid `minmax(200px,1fr)`: white cards radius 20, padding 22, 44px glyph tile, name 18/600, meta 13, 6px progress bar. Subjects (grade 3): الرياضيات 55% blue, لغتي 40% green, العلوم 20% amber, الدراسات الإسلامية 0% neutral.

### 5. Subject / lesson path
Title 32/700 with grade eyebrow. Vertical path, max-width 640: 36px status dot (✓ green `#1F8A5B` done, blue numbered for today/next, white with `#E3E6E1` border for later) connected by 2px `#EEF0EC` line; lesson card padding 18 20, radius 18, 2px border (`#2F6BD8` + bg `#F3F6FD` for today/next), later rows opacity .6. Tag pill: مكتمل (green) / درس اليوم / التالي (blue) / لاحقًا (neutral). Only the live lesson opens; others show a dark toast (bottom-center pill `#1B1F1D`, 2.2s).

### 6. Lesson intro
Centered, max-width 560. Character 150px with pulsing ring (`ring` keyframe 1.8s). Eyebrow "الرياضيات · 10 دقائق", title "درس الكسور" 34/700, line 22/500 lh 1.6: "هلا {name}. أولًا أشرح لك الفكرة بهدوء، وبعدين نجرب مع بعض وأسمع إجاباتك." Buttons "اشرح لي أول" (primary) / "ودّي أجرب مباشرة" (secondary).

### 7. Avatar explanation mode
Two-column grid `minmax(300px,1fr)`, gap 32, padding 36 32 24.
- Teacher column: 180px character (ring animates while speaking), status pill "يشرح…" / "انتهى من الشرح" with 4-bar waveform, subtitle 26/500 lh 1.65 max-width 440, fades up on change.
- Visual card `#F7F8F5` radius 20 min-height 340; visuals: whole pizza → half → quarter → fraction glyph 1/4 with legend (فوق: كم أخذنا / تحت: كم قسمنا). Pizza: 220px circle, 10px border `#E8DFCF`, base `#F6EFE2`, highlighted portion `#3B7DDC` via conic-gradient, 3px white dividers.
- 4-segment progress under the visual.
- Footer: "أعد الشرح" (secondary) + "التالي"/"خلصت" (primary). After step 4 finishes speaking: "جاهز نجرب مع بعض؟" + green button "نبدأ الأسئلة" (`#1F8A5B`, hover `#19714A`).
- Speaking duration = max(2200ms, 60ms × chars) — replace with real TTS end event.

Explanation script:
1. شوف هذي البيتزا. كاملة، ما قسمناها. هذا هو "الكل".
2. لو قسمناها إلى جزأين متساويين، كل جزء نسميه نصف. واحد من اثنين.
3. ولو قسمناها إلى 4 أجزاء متساوية، كل جزء نسميه رُبع. والربع أصغر من النصف.
4. الكسر يعني جزء من شي كامل. الرقم اللي تحت كم قسمنا، والرقم اللي فوق كم أخذنا.

### 8. Adaptive session (`المعلم الذكي.dc.html`)
Same frame. Header: lesson title "درس الكسور" + "الرياضيات · الأستاذ نواف", 5 progress dots (10px; `#2F6BD8` done / `#E3E6E1`), child chip.
- Teacher column: 128px character; status pill: speaking `#E7EFFC`/`#2F6BD8` "يتحدث…", listening `#E4F3EB`/`#1F8A5B` "أنا أسمعك", thinking `#F5F6F3` "أفهم إجابتك…", choosing green "ينتظر إجابتك". Green ✓ badge on avatar while encouraging. Subtitle 24/500 lh 1.65.
- Visual card + adaptation chip under it (amber `#FFF6E0`/`#8A6A1F` for strategy change, green for level up), e.g. "غيّر المعلم المثال: بيتزا ← شوكولاتة", "رفع المعلم المستوى ← متوسط".
- Interaction bar (min-height 112, top border): mic pill "اضغط للتحدث" (→ "أسمعك…" while recording) + "خذ وقتك، أنا أسمعك."; or answer buttons (min-width 120, 22/600, 2px border, hover blue); or thinking dots + child transcript bubble; or "الأستاذ نواف يتحدث…".
- Visuals: pizza half; pizza with 3/4 eaten; fraction glyph cards; chocolate 2×2 (bar `#5A3B2E`, squares `#7A5241`, highlighted `#C98B62` with `#F2D3B8` border, tappable — choices appear after 2 squares selected, hint "المس قطعتين من الشوكولاتة"); two comparison circles (half vs quarter, tappable, outline `#D5DEF3`).
- End screen: teacher line, "فهمك اليوم" rating (ممتاز ≥85% correct, جيد جدًا ≥60%, else جيد), "لاحظت أنك:" bullets derived from the path, CTAs "جرّب سؤال أخير" / "إنهاء الدرس".
- Summary: 6 stat tiles (مدة الجلسة، الأسئلة، الإجابات الصحيحة، مرات إعادة الشرح، مستوى البداية، مستوى النهاية) + numbered "كيف تكيّف المعلم؟" log built from real events.
- Demo controls: fixed bottom-left dark panel with 4 path buttons (يفهم / محتار / إجابة خاطئة / أداء قوي), enabled only while the teacher waits for an answer; optional live engine-state JSON. Keep behind a hidden gesture or `?demo=1` in production.

#### Session step graph
```
intro (listen) ─correct→ a1 → a2 ─1/2→ a3 (level↑) → h1 ─ok→ h2 → END
                │                └1/4→ c1 → c2 ─half→ c3 (level↑) → h1
                │                              └quarter→ c2r (retry) → c2
                ├unclear/dontknow→ b1 (strategy: chocolate) → b2 → b3 ─نصف→ b4 → a2
                │                                                └wrong→ b3r (retry)
                └strong→ a3
h1 wrong → h1r (retry, counting) → h1
END → "جرّب سؤال أخير" → x1 (3/4 vs 1/2) → x2 → SUMMARY ;  "إنهاء الدرس" → SUMMARY
```
Timings: speaking = max(1800ms, 55ms × chars); pause 500ms before auto-next; thinking 1600ms; mic recording 1800ms (simulated). A "fast" pace multiplies by 0.45.

Full copy per step is in `STEPS` in `المعلم الذكي.dc.html` — use verbatim.

### 9. Parent PIN
"منطقة ولي الأمر" 30/700, hint "أدخل رمز ولي الأمر" (error: "الرمز غير صحيح، حاول مرة ثانية." with red dots), same keypad component.

### 10. Parent area
Padding 40 32, gap 32. Title "{name} يتقدّم بثبات" 32/700 under eyebrow "هذا الأسبوع"; pill "العودة لواجهة الطالب".
- 4 stat tiles (`#F7F8F5` radius 16): جلسات 3 · وقت التعلم 28 دقيقة · إجابات صحيحة 11 من 14 · أبرز تحسّن (green tile) "المقارنة بين الكسور".
- Card "التقدّم في المواد": subject rows with 8px bars.
- Card "آخر الجلسات": 3 rows (title, meta, rating pill) + narrative box: "في جلسة الكسور، لم يفهم {name} الربع من الشرح الأول، فغيّر المعلم المثال إلى الشوكولاتة ثم رفع المستوى بعد إجابته الصحيحة."
- Card "توصيات الأستاذ نواف": 3 bullets (see file).
- Card "إعدادات بسيطة": duration chips 10/15/20 دقائق, reminder toggle (48×28, `#2F6BD8` on / `#D5D9D3` off, 22px knob).

---

## Lesson engine (the core)
Do not let the LLM free-run. Keep a small state machine around it.

```json
// session state per turn
{ "concept": "one-quarter", "difficulty": 2, "attempts": 2,
  "understanding": "partial", "previous_strategy": "pizza_visual",
  "next_strategy": "chocolate_visual" }
```
```json
// model output contract (structured)
{ "assessment": "understood|confused|wrong|strong",
  "next_action": "continue|re_explain|different_example|retry|increase_difficulty",
  "difficulty_change": -1, "teaching_strategy": "concrete_visual_example",
  "visual": "pizzaHalf|pizza34|fractions|chocOne|chocPick|chocTwo|compare|comparePick",
  "response": "خلنا نجربها بطريقة ثانية..." }
```
The UI maps `visual` to a component, `response` to TTS + subtitle, and appends a human-readable adaptation log entry (used by the end screen, parent summary and analytics). Lesson content is a JSON definition (steps, visuals, choices, correct answers, retry copy) — see `STEPS`.

Voice: use a realtime speech-to-speech API (Gemini Live or OpenAI Realtime) with barge-in; teacher states Idle → Listening → Thinking → Speaking → Encouraging drive the character. Fall back to choice buttons when mic is unavailable.

---

## Design tokens
Colors: page `#F3F4F1` · surface `#FFFFFF` · surface-2 `#F7F8F5` · surface-3 `#F5F6F3` · border `#EEF0EC` / `#E3E6E1` · text `#1B1F1D` · text-2 `#3D4442` · text-muted `#6B7370` · text-faint `#9AA19D` · primary `#2F6BD8` (hover `#2559BD`, tint `#E7EFFC`, alt tint `#F3F6FD`) · success `#1F8A5B` (hover `#19714A`, tint `#E4F3EB`) · warning `#8A6A1F` / tint `#FFF6E0` · error `#D9534F` · visual accent `#3B7DDC` · pizza `#F6EFE2`/`#E8DFCF` · chocolate `#5A3B2E`/`#7A5241`/`#C98B62`/`#F2D3B8` · dark panel `#1B1F1D`/`#2A2F2D`/`#3D4442`.

Type: **IBM Plex Sans Arabic** 400/500/600/700 (Google Fonts). Scale: 40/700 hero · 34–30/700 titles · 26–22/500 teacher speech · 20–18/600 card titles · 17–16 buttons · 15 body · 14 labels · 13 meta · 11 mono (engine state).

Radius: 999 pills · 24 frame/hero cards · 20 cards · 16 tiles/buttons · 14 buttons/inputs · 12 chips · 10 small.
Spacing: 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56.
Shadows: frame `0 1px 2px rgba(20,30,25,.04), 0 12px 40px rgba(20,30,25,.06)` · primary button `0 8px 24px rgba(47,107,216,.25)` · dark panel `0 12px 40px rgba(0,0,0,.25)`.
Motion: `fadeUp` 8px/0.3–0.45s ease · `ring` 1.6–1.8s ease-out infinite (scale 1→1.35, opacity .55→0) · `wave` bars 0.9–1.3s ease-in-out infinite (scaleY .35→1) · `float` 5s · `dots` 1.2s. Transitions 200–400ms.

Layout: RTL (`dir="rtl"`), grids use `repeat(auto-fit, minmax(300px,1fr))`; tablet-first, works to ~600px. Minimum tap target 44px (child-facing buttons are 48–64px).

## Assets
No images. Character is typographic ("ن" in a circle) for the MVP; replace with a 2D character with 5 states (Idle, Listening, Thinking, Speaking, Encouraging) when available. Emoji used: 👋 (greeting), 👏 (praise) — keep.

## Suggested Next.js structure
```
app/
  layout.tsx                 # RTL, IBM Plex Sans Arabic, bg #F3F4F1
  page.tsx                   # Landing
  onboarding/page.tsx        # 3-step parent setup
  profiles/page.tsx
  home/page.tsx              # Child home
  subjects/[id]/page.tsx     # Lesson path
  lesson/[id]/page.tsx       # Lesson intro
  lesson/[id]/explain/page.tsx
  lesson/[id]/session/page.tsx
  lesson/[id]/summary/page.tsx
  parent/pin/page.tsx
  parent/page.tsx
components/
  Frame.tsx  AppHeader.tsx  Teacher.tsx (character + states)  Waveform.tsx
  StatusPill.tsx  Subtitle.tsx  ProgressDots.tsx  Keypad.tsx  Toast.tsx
  visuals/ Pizza.tsx  Chocolate.tsx  CompareCircles.tsx  FractionGlyph.tsx
  session/ InteractionBar.tsx  MicButton.tsx  Choices.tsx  AdaptChip.tsx  DemoControls.tsx
lib/
  lesson-engine/ types.ts  reducer.ts (state machine)  fractions.lesson.json  prompts.ts
  voice/ realtime.ts (Gemini Live / OpenAI Realtime client)  tts-fallback.ts
  analytics/ events.ts
  db/ supabase.ts (sessions, events, summaries)
```
State: session state lives server-side (route handler / WebSocket); the client mirrors `{phase, step, transcript, log, difficulty, strategy, understanding}`. Parent PIN and child profile in Supabase; summaries generated from the event log at session end.
