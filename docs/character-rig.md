# Character rig: الأستاذ نواف

Spec for the Rive file that replaces the code-drawn SVG rig. The app already
drives a character through the inputs below (see `lib/character/contract.ts`);
export the file to `public/characters/nawaf.riv` and it is picked up with
`?character=rive` or `NEXT_PUBLIC_CHARACTER=rive`. Compare both renderers at
`/dev/character`.

## File

| | |
| --- | --- |
| File | `public/characters/nawaf.riv` |
| Artboard | `Nawaf`, 512 × 512, transparent background |
| State machine | `Teacher` |
| Fit | Contain, centered. The app shows the artboard inside a circle (112–180 px), so keep the head and shoulders within the inner 80% and nothing important in the corners. |

## Inputs

| Name | Type | Range | Driven by |
| --- | --- | --- | --- |
| `state` | Number | 0 idle · 1 listening · 2 thinking · 3 speaking · 4 encouraging | lesson engine phase |
| `viseme` | Number | 0–7 (table below) | voice adapter, from TTS timestamps or audio amplitude, ~60 changes/s max |
| `level` | Number | 0–1 | mic input level while listening |
| `blink` | Trigger | optional | not fired today; auto-blink inside the rig is preferred |

The runtime sets `state` and `viseme` as plain number inputs. Transitions
between states should take 200–300 ms; viseme changes must be near-instant
(≤ 80 ms blend) or lips will lag the audio.

## States

| # | State | What the child sees |
| --- | --- | --- |
| 0 | Idle | Slow breathing bob (~3 s), blink every 4–6 s, neutral small smile. |
| 1 | Listening | Head tilts toward the child, brows up, eyes a little wider. `level` may add a subtle lean or ear wiggle. Mouth closed. |
| 2 | Thinking | Eyes glance up and to the side, one brow raised, lips pursed. A slow 2–3 s loop. |
| 3 | Speaking | Gentle head motion (~1 s loop); the mouth layer follows `viseme`. |
| 4 | Encouraging | Big smile, happy squinted eyes, blush, optional sparkle. Mouth still follows `viseme` because the teacher is speaking a praise line. The green ✓ badge is drawn by the app, not the rig. |

## Visemes (mouth layer)

Use a 1D blend state on `viseme` with eight keyed mouth shapes, or a nested
artboard with eight frames. Shapes are grouped, not phonetic, because Arabic
TTS gives character timestamps rather than phonemes.

| # | Shape | Arabic letters that map here |
| --- | --- | --- |
| 0 | rest (closed, relaxed) | spaces, punctuation |
| 1 | open (a) | ا أ إ آ ة ه ح ع ء ى, fatha, digits |
| 2 | round (u/o) | و ؤ, damma |
| 3 | wide (i) | ي ئ, kasra |
| 4 | lips pressed (b/m) | ب م |
| 5 | lip on teeth (f) | ف |
| 6 | tongue on teeth (t/d/s/l/n/r) | ت د ن ل ث ذ ط ض ظ س ز ص ر |
| 7 | back of mouth (k/q/g/x/sh) | ك ق غ خ ج ش |

## Style

Flat, rounded, warm. The app's palette: primary `#2F6BD8` (glasses, pen),
tint `#E7EFFC` (circle behind the character), success `#1F8A5B` (sparkle),
skin `#F1C9A5`, hair `#2B2320`, white thobe with `#E3E6E1` edge. Line weight
around 2–3 px at 200 px. No text in the rig.

## Checklist before handing off

- [ ] Inputs named exactly `state`, `viseme`, `level` on state machine `Teacher`
- [ ] All five states reachable from any other state
- [ ] Viseme 0 while `state` is 0, 1 or 2 shows a closed mouth
- [ ] File under 300 KB; no raster images unless embedded at ≤ 512 px
- [ ] Verified in `/dev/character` with "play lip-sync" on a rendered line
