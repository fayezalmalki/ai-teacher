"use client";

/**
 * الأستاذ نواف as a code-drawn SVG rig.
 *
 * Implements the same input contract as the Rive character
 * (lib/character/contract.ts): five states and an 8-value viseme, plus the
 * mic level while listening. Drop `public/characters/nawaf.riv` in and the
 * Character component switches to the Rive runtime with identical inputs.
 */
import type { CSSProperties } from "react";
import type { Viseme } from "@/lib/voice/types";
import type { TeacherState } from "@/lib/character/contract";

interface NawafSvgProps {
  size: number;
  state: TeacherState;
  viseme: Viseme;
  /** 0–1 mic level; nudges the head while listening. */
  level?: number;
  className?: string;
}

const C = {
  skin: "#F1C9A5",
  skinShade: "#D9A07C",
  hair: "#2B2320",
  thobe: "#FFFFFF",
  thobeEdge: "#E3E6E1",
  mouth: "#4A2222",
  lip: "#A5583F",
  tongue: "#E27A78",
  teeth: "#FFFFFF",
  cheek: "#F2A7A0",
  eye: "#1B1F1D",
  white: "#FFFFFF",
  glasses: "var(--color-primary)",
  sparkle: "var(--color-success)",
};

/** Inner-mouth scale [sx, sy] and which parts show, per grouped viseme. */
const MOUTH: Record<Viseme, { sx: number; sy: number; teeth: boolean; tongue: boolean }> = {
  0: { sx: 0, sy: 0, teeth: false, tongue: false },
  1: { sx: 1, sy: 1, teeth: true, tongue: true },
  2: { sx: 0.55, sy: 0.85, teeth: false, tongue: false },
  3: { sx: 1.25, sy: 0.45, teeth: true, tongue: false },
  4: { sx: 0, sy: 0, teeth: false, tongue: false },
  5: { sx: 0.9, sy: 0.35, teeth: true, tongue: false },
  6: { sx: 0.9, sy: 0.6, teeth: true, tongue: true },
  7: { sx: 0.75, sy: 0.85, teeth: false, tongue: true },
};

const EASE = "180ms ease";

export default function NawafSvg({ size, state, viseme, level = 0, className = "" }: NawafSvgProps) {
  const listening = state === "listening";
  const thinking = state === "thinking";
  const speaking = state === "speaking" || state === "encouraging";
  const happy = state === "encouraging";
  const m = MOUTH[viseme];
  const mouthOpen = m.sx > 0;

  const headTransform = listening
    ? `rotate(-5deg) scale(${1 + Math.min(1, level) * 0.04})`
    : thinking
      ? "rotate(3deg) translateY(1px)"
      : happy
        ? "translateY(-2px)"
        : "none";
  const headAnimation =
    state === "idle" ? "nawaf-bob 3.2s ease-in-out infinite" : speaking ? "nawaf-talk 1.1s ease-in-out infinite" : "none";

  const head: CSSProperties = {
    transformOrigin: "100px 128px",
    transform: headTransform,
    transition: `transform 260ms ease`,
    animation: headAnimation,
  };
  const browL: CSSProperties = {
    transformOrigin: "80px 84px",
    transform: listening ? "translateY(-3px)" : thinking ? "translateY(-4px) rotate(-8deg)" : happy ? "translateY(-1px)" : "none",
    transition: `transform ${EASE}`,
  };
  const browR: CSSProperties = {
    transformOrigin: "120px 84px",
    transform: listening ? "translateY(-3px)" : thinking ? "translateY(1px) rotate(4deg)" : happy ? "translateY(-1px)" : "none",
    transition: `transform ${EASE}`,
  };
  const pupils: CSSProperties = {
    transform: thinking ? "translate(2.5px, -3px)" : listening ? "translate(0, 0.5px)" : "none",
    transition: `transform ${EASE}`,
    animation: thinking ? "nawaf-think 2.4s ease-in-out infinite" : "none",
  };
  const lids: CSSProperties = {
    transformOrigin: "100px 100px",
    animation: happy ? "none" : "nawaf-blink 4.6s ease-in-out infinite",
  };
  const inner: CSSProperties = {
    transformOrigin: "100px 132px",
    transform: `scale(${m.sx}, ${m.sy})`,
    transition: "transform 70ms linear",
  };
  const smileD = happy
    ? "M86 130 Q100 142 114 130"
    : viseme === 4
      ? "M89 131 L111 131"
      : listening
        ? "M90 131 Q100 136 110 131"
        : "M89 130 Q100 136 111 130";

  return (
    <svg
      className={"nawaf " + className}
      width={size}
      height={size}
      viewBox="22 46 156 156"
      role="img"
      aria-label="الأستاذ نواف"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <clipPath id="nawaf-mouth-clip">
          <ellipse cx="100" cy="132" rx="13" ry="8" />
        </clipPath>
        <clipPath id="nawaf-smile-clip">
          <path d="M84 130 Q100 150 116 130 Z" />
        </clipPath>
      </defs>

      {/* thobe */}
      <path d="M38 200 C38 158 62 146 100 146 C138 146 162 158 162 200 Z" fill={C.thobe} stroke={C.thobeEdge} strokeWidth="2" />
      <path d="M100 148 L94 160 L100 172 L106 160 Z" fill="var(--color-primary-tint)" />
      <rect x="124" y="166" width="4" height="18" rx="1.5" fill="var(--color-primary)" transform="rotate(-8 126 175)" />

      <g style={head}>
        {/* neck + ears */}
        <rect x="90" y="130" width="20" height="24" rx="6" fill={C.skinShade} />
        <ellipse cx="53" cy="106" rx="7" ry="10" fill={C.skin} />
        <ellipse cx="147" cy="106" rx="7" ry="10" fill={C.skin} />

        {/* face + beard */}
        <ellipse cx="100" cy="106" rx="46" ry="48" fill={C.skin} />
        <path d="M58 112 C62 150 138 150 142 112 C136 140 120 148 100 148 C80 148 64 140 58 112 Z" fill={C.hair} opacity="0.92" />
        <ellipse cx="100" cy="120" rx="30" ry="22" fill={C.skin} />

        {/* hair */}
        <path d="M52 100 C52 40 148 40 148 100 C140 84 122 76 100 76 C78 76 60 84 52 100 Z" fill={C.hair} />
        <path d="M60 92 C70 72 130 72 140 92 C128 86 112 84 100 84 C88 84 72 86 60 92 Z" fill={C.hair} />

        {/* cheeks */}
        <circle cx="68" cy="118" r="6.5" fill={C.cheek} style={{ opacity: happy ? 0.7 : 0, transition: `opacity ${EASE}` }} />
        <circle cx="132" cy="118" r="6.5" fill={C.cheek} style={{ opacity: happy ? 0.7 : 0, transition: `opacity ${EASE}` }} />

        {/* brows */}
        <path d="M70 86 Q80 80 90 85" stroke={C.hair} strokeWidth="3.2" strokeLinecap="round" fill="none" style={browL} />
        <path d="M110 85 Q120 80 130 86" stroke={C.hair} strokeWidth="3.2" strokeLinecap="round" fill="none" style={browR} />

        {/* eyes */}
        {happy ? (
          <g>
            <path d="M71 101 Q80 92 89 101" stroke={C.eye} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M111 101 Q120 92 129 101" stroke={C.eye} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          <g style={lids}>
            <ellipse cx="80" cy="100" rx="8" ry="8.5" fill={C.white} />
            <ellipse cx="120" cy="100" rx="8" ry="8.5" fill={C.white} />
            <g style={pupils}>
              <circle cx="81" cy="101" r="4" fill={C.eye} />
              <circle cx="121" cy="101" r="4" fill={C.eye} />
              <circle cx="82.5" cy="99.5" r="1.2" fill={C.white} />
              <circle cx="122.5" cy="99.5" r="1.2" fill={C.white} />
            </g>
          </g>
        )}

        {/* glasses */}
        <g stroke={C.glasses} strokeWidth="2.2" fill="none">
          <circle cx="80" cy="100" r="12" />
          <circle cx="120" cy="100" r="12" />
          <path d="M92 100 Q100 96 108 100" />
          <path d="M68 99 L60 97" />
          <path d="M132 99 L140 97" />
        </g>

        {/* nose */}
        <path d="M100 108 Q96 116 102 118" stroke={C.skinShade} strokeWidth="2.4" strokeLinecap="round" fill="none" />

        {/* mouth */}
        <g>
          {happy && !mouthOpen && (
            <g clipPath="url(#nawaf-smile-clip)">
              <path d="M84 130 Q100 150 116 130 Z" fill={C.mouth} />
              <rect x="86" y="128" width="28" height="5" fill={C.teeth} />
            </g>
          )}
          <g style={inner} clipPath="url(#nawaf-mouth-clip)">
            <ellipse cx="100" cy="132" rx="13" ry="8" fill={C.mouth} />
            {m.tongue && <ellipse cx="100" cy="139" rx="8" ry="5" fill={C.tongue} />}
            {m.teeth && <rect x="88" y="124" width="24" height="4" rx="1" fill={C.teeth} />}
          </g>
          {!mouthOpen && !(happy && !mouthOpen) && (
            <path d={smileD} stroke={C.lip} strokeWidth="2.4" strokeLinecap="round" fill="none" style={{ transition: `d ${EASE}` }} />
          )}
        </g>
      </g>

      {/* encouraging sparkles */}
      {happy && (
        <g fill={C.sparkle}>
          <path d="M150 70 L152 76 L158 78 L152 80 L150 86 L148 80 L142 78 L148 76 Z" style={{ transformOrigin: "150px 78px", animation: "nawaf-sparkle 1.4s ease-in-out infinite" }} />
          <path d="M50 84 L51.5 88 L56 89.5 L51.5 91 L50 95 L48.5 91 L44 89.5 L48.5 88 Z" style={{ transformOrigin: "50px 89.5px", animation: "nawaf-sparkle 1.4s ease-in-out .5s infinite" }} />
        </g>
      )}
    </svg>
  );
}
