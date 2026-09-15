"use client";

/**
 * Character preview for designers and QA: every state, every viseme, the
 * three renderers side by side, and a lip-sync playback from the rendered
 * manifest when one exists. Not linked from the app; open /dev/character.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Teacher from "@/components/Teacher";
import { STATES, VISEMES, VISEME_LABELS, type CharacterMode, type TeacherState } from "@/lib/character/contract";
import { manifestPath, visemeAt, type LinesManifest } from "@/lib/voice/lines";
import type { Viseme, VisemeFrame } from "@/lib/voice/types";

const STATE_LABEL: Record<TeacherState, string> = {
  idle: "Idle",
  listening: "Listening · أنا أسمعك",
  thinking: "Thinking · أفهم إجابتك",
  speaking: "Speaking · يتحدث",
  encouraging: "Encouraging · ممتاز 👏",
};

const MODES: CharacterMode[] = ["svg", "rive", "glyph"];

/** A short synthetic track so playback works before any lines are rendered. */
const DEMO_TRACK: VisemeFrame[] = [1, 6, 1, 0, 4, 1, 3, 0, 2, 6, 1, 7, 1, 0, 5, 3, 0].map((v, i) => ({ t: i * 110, v: v as Viseme }));

export default function CharacterPreviewPage() {
  const [state, setState] = useState<TeacherState>("idle");
  const [viseme, setViseme] = useState<Viseme>(0);
  const [level, setLevel] = useState(0);
  const [mode, setMode] = useState<CharacterMode>("svg");
  const [playing, setPlaying] = useState(false);
  const [manifest, setManifest] = useState<LinesManifest | null>(null);
  const [lineHash, setLineHash] = useState<string>("");
  const raf = useRef(0);

  useEffect(() => {
    fetch(manifestPath("fractions"))
      .then((r) => (r.ok ? r.json() : null))
      .then((m: LinesManifest | null) => {
        setManifest(m);
        if (m) setLineHash(Object.keys(m.lines)[0] ?? "");
      })
      .catch(() => setManifest(null));
  }, []);

  const track = useMemo<VisemeFrame[]>(() => {
    const line = manifest?.lines[lineHash];
    return line ? line.visemes : DEMO_TRACK;
  }, [manifest, lineHash]);
  const trackEnd = track.length ? track[track.length - 1].t + 200 : 2000;

  useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) % trackEnd;
      setViseme(visemeAt(track, t));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      setViseme(0);
    };
  }, [playing, track, trackEnd]);

  const chip = (on: boolean) =>
    "px-3.5 py-2 r-chip ink-2 text-[14px] font-semibold " + (on ? "bg-primary text-white" : "bg-surface text-ink hover:bg-hover");

  return (
    <Frame>
      <AppHeader />
      <div className="flex-1 flex flex-col gap-8 px-8 py-10" dir="ltr">
        <div>
          <div className="text-[14px] text-muted">dev · character rig</div>
          <h1 className="font-display text-[36px] font-bold mt-1 m-0">الأستاذ نواف</h1>
          <p className="text-[15px] text-ink-2 mt-2 m-0 max-w-[640px]">
            Same inputs for every renderer: five states, an 8-value viseme, and the mic level. Drop{" "}
            <code className="text-[13px] bg-hover px-1.5 py-0.5 rounded">public/characters/nawaf.riv</code> in and pick
            &quot;rive&quot; to compare against the SVG rig.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 items-end">
          {[180, 128, 112].map((size) => (
            <div key={size} className="flex flex-col items-center gap-3 r-card-1 ink-2 bg-surface p-6">
              <Teacher
                size={size}
                state={state}
                viseme={viseme}
                level={level}
                character={mode}
              />
              <div className="text-[12px] font-mono text-muted">{size}px</div>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-3">
          <div className="text-[13px] font-mono uppercase tracking-wider text-muted">state</div>
          <div className="flex gap-2 flex-wrap">
            {STATES.map((s) => (
              <button key={s} type="button" className={chip(state === s)} onClick={() => setState(s)}>
                {STATE_LABEL[s]}
              </button>
            ))}
          </div>
          {state === "listening" && (
            <label className="flex items-center gap-3 text-[14px] text-ink-2">
              level
              <input id="level" type="range" min={0} max={100} value={Math.round(level * 100)} onChange={(e) => setLevel(Number(e.target.value) / 100)} />
              <span className="font-mono text-[12px]">{level.toFixed(2)}</span>
            </label>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="text-[13px] font-mono uppercase tracking-wider text-muted">viseme</div>
          <div className="flex gap-2 flex-wrap">
            {VISEMES.map((v) => (
              <button
                key={v}
                type="button"
                className={chip(viseme === v && !playing)}
                onClick={() => {
                  setPlaying(false);
                  setViseme(v);
                }}
              >
                {v} · {VISEME_LABELS[v]}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <button type="button" className={chip(playing)} onClick={() => setPlaying((p) => !p)}>
              {playing ? "■ stop" : "▶ play lip-sync"}
            </button>
            {manifest ? (
              <select
                id="line"
                className="px-3 py-2 r-chip ink-2 bg-surface text-[14px] max-w-[420px]"
                value={lineHash}
                onChange={(e) => setLineHash(e.target.value)}
                dir="rtl"
              >
                {Object.entries(manifest.lines).map(([hash, l]) => (
                  <option key={hash} value={hash}>
                    {l.id} · {l.text.slice(0, 40)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[13px] text-muted">no manifest yet — run `npm run render-lines -- --provider mock` to play real lines</span>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="text-[13px] font-mono uppercase tracking-wider text-muted">renderer</div>
          <div className="flex gap-2 flex-wrap">
            {MODES.map((m) => (
              <button key={m} type="button" className={chip(mode === m)} onClick={() => setMode(m)}>
                {m}
              </button>
            ))}
          </div>
        </section>
      </div>
    </Frame>
  );
}
