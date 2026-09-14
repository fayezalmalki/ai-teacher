"use client";

/**
 * Binds the designer's .riv file to the character contract. Loaded lazily by
 * Character.tsx only when the file exists, so the ~200 KB runtime never ships
 * to sessions that use the SVG rig.
 */
import { useEffect } from "react";
import { Alignment, Fit, Layout, useRive, useStateMachineInput } from "@rive-app/react-canvas";
import {
  INPUT_LEVEL,
  INPUT_STATE,
  INPUT_VISEME,
  RIVE_ARTBOARD,
  RIVE_STATE_MACHINE,
  STATE_INDEX,
  type TeacherState,
} from "@/lib/character/contract";
import type { Viseme } from "@/lib/voice/types";

interface RiveTeacherProps {
  src: string;
  size: number;
  state: TeacherState;
  viseme: Viseme;
  level?: number;
  /** Called when the file fails to load or lacks the expected inputs; the caller falls back to the SVG rig. */
  onFail?: (reason: string) => void;
}

export default function RiveTeacher({ src, size, state, viseme, level = 0, onFail }: RiveTeacherProps) {
  const { rive, RiveComponent } = useRive({
    src,
    artboard: RIVE_ARTBOARD,
    stateMachines: RIVE_STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: () => onFail?.("load error"),
  });
  const stateInput = useStateMachineInput(rive, RIVE_STATE_MACHINE, INPUT_STATE);
  const visemeInput = useStateMachineInput(rive, RIVE_STATE_MACHINE, INPUT_VISEME);
  const levelInput = useStateMachineInput(rive, RIVE_STATE_MACHINE, INPUT_LEVEL);

  useEffect(() => {
    if (!rive) return;
    const inputs = rive.stateMachineInputs(RIVE_STATE_MACHINE)?.map((i) => i.name) ?? [];
    if (!inputs.includes(INPUT_STATE) || !inputs.includes(INPUT_VISEME)) {
      onFail?.(`state machine "${RIVE_STATE_MACHINE}" is missing inputs (${inputs.join(", ") || "none"})`);
    }
  }, [rive, onFail]);

  useEffect(() => {
    if (stateInput) stateInput.value = STATE_INDEX[state];
  }, [stateInput, state]);
  useEffect(() => {
    if (visemeInput) visemeInput.value = viseme;
  }, [visemeInput, viseme]);
  useEffect(() => {
    if (levelInput) levelInput.value = Math.max(0, Math.min(1, level));
  }, [levelInput, level]);

  return (
    <div style={{ width: size, height: size }} aria-label="الأستاذ نواف" role="img">
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
