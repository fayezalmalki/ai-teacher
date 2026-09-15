"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { RIVE_FILE, type CharacterMode, type TeacherState } from "@/lib/character/contract";
import type { TeacherLook } from "@/lib/character/looks";
import type { Viseme } from "@/lib/voice/types";
import NawafSvg from "./NawafSvg";

const RiveTeacher = dynamic(() => import("./RiveTeacher"), { ssr: false });

interface CharacterProps {
  mode: CharacterMode;
  size: number;
  state: TeacherState;
  viseme?: Viseme;
  level?: number;
  /** Font size for the typographic mode. */
  glyphSize?: number;
  /** Outfit preset for the SVG rig. */
  look?: TeacherLook;
}

let riveProbe: Promise<boolean> | null = null;
/** HEAD-probe the .riv once per page load; a missing file means the SVG rig. */
function riveAvailable(): Promise<boolean> {
  if (!riveProbe) {
    riveProbe = fetch(RIVE_FILE, { method: "HEAD" })
      .then((r) => r.ok && !(r.headers.get("content-type") ?? "").includes("text/html"))
      .catch(() => false);
  }
  return riveProbe;
}

/** Picks the renderer for الأستاذ نواف. All three honor the same state + viseme contract. */
export default function Character({ mode, size, state, viseme = 0, level = 0, glyphSize, look }: CharacterProps) {
  const [rive, setRive] = useState<"unknown" | "yes" | "no">(mode === "rive" ? "unknown" : "no");

  useEffect(() => {
    if (mode !== "rive") return;
    let alive = true;
    riveAvailable().then((ok) => {
      if (!alive) return;
      if (!ok) console.info(`[character] ${RIVE_FILE} not found, using the SVG rig`);
      setRive(ok ? "yes" : "no");
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  if (mode === "glyph") {
    return (
      <span className="grid place-items-center w-full h-full font-bold text-primary" style={{ fontSize: glyphSize ?? Math.round(size * 0.41) }}>
        ن
      </span>
    );
  }
  if (mode === "rive" && rive === "yes") {
    return (
      <RiveTeacher
        src={RIVE_FILE}
        size={size}
        state={state}
        viseme={viseme}
        level={level}
        onFail={(reason) => {
          console.warn(`[character] falling back to the SVG rig: ${reason}`);
          setRive("no");
        }}
      />
    );
  }
  return <NawafSvg size={size} state={state} viseme={viseme} level={level} look={look} />;
}
