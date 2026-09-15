# v2 — Minimal, hand-drawn restyle (supersedes the visual spec in README.md)

Journeys, screens, lesson engine, step graph, copy and Next.js structure in `README.md` still apply. v2 changes **how it looks and how much is on screen**. Where this file and README.md disagree on visuals, this file wins.

## Files
- `المعلم الذكي — التطبيق v2.dc.html` — full app journey, v2 look.
- `المعلم الذكي v2.dc.html` — adaptive session, v2 look. Props: `autoStart`, `onBack`, `pace`, `showEngineState`.
- `site-config.js` — footer links, social links, powered-by brand. The only place to edit these.
- `assets/mvp-black.png` — MVP logo (black, for cream/white surfaces). White/gradient variants available on request for dark surfaces.
- `support.js` — runtime for viewing the HTML references only.

## Principles
1. **No frame.** The page is the surface (`#FBF8F1` cream). No white card, no header bar, no footer bar, no bordered visual box.
2. **Corner chrome only.** Top row: back button + wordmark (right), parent pill + child initial (left). 22px from top, 32px from sides. Hidden entirely during the session (the session draws its own row: back + "درس الكسور", 5 progress dots, child initial).
3. **Teacher speaks, nothing else.** In session/explain: avatar (120px) + one sentence (34px display) + floating visual. No status pill, no name label, no caption, no footer hint. State is shown through motion only.
4. **One action zone.** Centered below the content, min-height 120px: mic pill, or 2–3 answer buttons, or thinking dots, or nothing.
5. **Playful through motion, not content.** Spring pop-in for visuals and buttons, avatar wobble while speaking, nod on praise, dashed ring while speaking.
6. **Guided demo.** `guidedDemo` flag (default on): child home shows only today's lesson + "استعرض كل المواد" link. Off = full subject library. Data model (subjects → lessons) is already scalable; add entries to grow.

## Tokens (v2)
Colors: cream page `#FBF8F1` · surface `#FFFFFF` · ink `#23272A` · text-2 `#5C6360` · muted `#8A8F8B` · faint `#B0B5B0` · rule `#C9CDC8` · blue `#2F6BD8` (tint `#E7EFFC`) · yellow `#FFD23F` (tint `#FFF0B8`) · green `#1F8A5B` (tint `#DDF1E6`) · pizza cream `#FFF6DF` · pizza shadow `#EFE9DC` · chocolate `#8B5E3C` · error `#D9534F`.

Type: **Baloo Bhaijaan 2** 600/700 for headings, teacher speech, buttons, numbers. **IBM Plex Sans Arabic** 400/500/600 for body and labels. Scale: 52 hero · 44–38 titles · 34 teacher speech · 26 card titles · 22–18 buttons · 18–15 body · 14–13 labels · 12 footer.

Hand-drawn vocabulary:
- Strokes: `3px solid #23272A` on primary shapes/buttons; `2px` on small chips, dots, avatars; `2px dashed #C9CDC8` for section rules and lesson-path connectors.
- Wobbly radii (cycle these, never a plain uniform radius on primary shapes):
  - buttons: `18px 22px 16px 24px / 22px 16px 24px 18px`, `22px 16px 24px 18px / 18px 24px 16px 22px`, `16px 24px 18px 22px / 24px 18px 22px 16px`
  - circles: `50% 46% 54% 50% / 52% 50% 48% 50%` (avatar), `50% 47% 53% 50% / 52% 50% 48% 50%` (pizza), `50% 45% 55% 50%` (dots)
  - cards: `22px 26px 20px 28px / 26px 20px 28px 22px` (and rotations of it)
- Shadows are flat offsets, never blurred: primary buttons `5px 5px 0 #23272A`; hover `7px 7px 0` + `translate(-2px,-2px)`; active `1px 1px 0` + `translate(3px,3px)`. Decorative shadows on cards/visuals use a tint: `6px 6px 0 #E7EFFC`, `8px 8px 0 #EFE9DC`, `10px 10px 0 #E7EFFC`.
- Fills: highlighted fraction parts are **hatched**, not solid: `repeating-linear-gradient(45deg, #2F6BD8 0 4px, transparent 4px 11px)` applied once to the whole shape, with cream quadrant masks on top for the un-eaten parts (never per-quadrant gradients — they seam). Chocolate: squares `#8B5E3C`, selected = hatch + `rotate(-2deg) scale(.97)`.
- Fraction glyph: numerals in Baloo 72–84px, bar `64–72px × 4px`, `rotate(-2deg)`.

Motion: `popIn` 0.45–0.5s `cubic-bezier(.34,1.56,.64,1)` (scale .85→1.04→1, rotate -2°→.5°→0) on visuals and buttons, staggered 80ms per button · `wobble` ±1.5° 2.4s while speaking · `nod` 1.2–1.4s on praise · `ring` dashed blue 1.6s ease-out infinite while speaking · `float` 8px 5s on landing/home hero · `fadeUp` 10px 0.3–0.45s for text · `wave` 4 green bars 0.9–1.3s while listening · `dots` 1.2s while thinking.

## Screens (v2 deltas)
- **Landing**: wordmark only at top; H1 52px "معلم يشرح، يسمع، ويغيّر طريقته حسب طفلك."; one sub line; two buttons (blue "ابدأ الإعداد", white "أنا طالب"); dashed-underline link "جرّب درس الكسور الآن ←". Avatar 260px with two speech bubbles (white / yellow). Three cards, each a word + one line, ink border, tinted offset shadow. Footer: links row + socials (from `site-config.js`), "تم التطوير بواسطة [MVP logo 14px]" + © line, above a dashed rule.
- **Onboarding**: 3 ink progress bars; name input Baloo 22px with ink border; age/grade chips 48px, selected = blue fill white text; keypad 3×72 with ink borders; done = yellow star circle with popIn.
- **Profiles**: "من أنت؟" 44px; child tile 190px with yellow initial circle; dashed "طالب جديد".
- **Child home**: "هلا {name}!" 48px + "درس اليوم: الكسور · 10 دقائق" + blue "يلا نبدأ" + 7 streak dots. Half-pizza hero with yellow bubble "وش يعني النصف؟". Guided: one line + link; unguided: subject pills (name + 56px progress bar). Faint "Powered by MVP" bottom-left.
- **Subject**: 44px title; lesson path with ink dots (✓ green, numbered blue for today/next), dashed connector, today/next rows ink-bordered with `5px 5px 0 #E7EFFC`; later rows 60% opacity, no shadow.
- **Lesson intro**: avatar 140px with dashed ring; "هلا {name}. أشرح لك أول، أو نجرب مباشرة؟"; buttons "اشرح لي" / "نجرب".
- **Explain**: same layout as session; footer buttons "مرة ثانية" / "التالي"→"خلصت"; after step 4 a single green "يلا نجرب مع بعض".
- **Session**: start = avatar + "هلا سلمان، جاهز؟" + "يلا نبدأ". Lesson = as principles 3–4; adaptation note is a small dashed-underlined muted line under the sentence. Mic pill Baloo 22 "تكلّم" → green fill "أسمعك…" while recording, with a small wave badge on the avatar. Answer buttons Baloo 26 with cycled wobbly radii. End = nodding avatar + yellow star badge, "{rating} يا سلمان!" 40px, one sentence, "سؤال أخير؟" / "خلصنا". Summary = 4 big numbers as plain type, dashed rule, numbered adaptation log, "من البداية".
- **Parent PIN**: "ولي الأمر" 38px, hint, dots, keypad.
- **Parent**: 40px title; 4 stats as plain big type (no tiles); dashed-rule sections: المواد (140px label + 10px ink-bordered bar + meta), آخر الجلسات (rows + dashed narrative box), توصيات (3 lines), settings (duration chips + ink toggle). Footer with links + MVP mark.
- **Toast**: yellow, ink border, `4px 4px 0 #23272A`, popIn, bottom center.

## Footer / links management
All footer and brand content lives in `site-config.js` (`site.links`, `site.social`, `site.poweredBy`). In the Next.js build, mirror this as `lib/site.ts` and render `<Footer variant="full" | "slim">` on landing / parent; a `<PoweredBy>` mark on child home. Never hard-code links in components.

## Next.js additions
```
lib/site.ts                 # from site-config.js
components/Footer.tsx       # full (landing) + slim (parent)
components/PoweredBy.tsx
components/Sketch.tsx       # SketchButton, SketchCard, SketchCircle: ink stroke, wobbly radius, offset shadow, spring hover
components/visuals/Pizza.tsx  # single hatch layer + cream quadrant masks; props: filled 0–4, dividers 'v'|'vh'|'none'
public/brand/mvp-black.png
```
Feature flag: `NEXT_PUBLIC_GUIDED_DEMO=true` → child home hides the library behind "استعرض كل المواد".
