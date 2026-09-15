"use client";

import type { VisualRef } from "@/lib/lesson-engine/types";
import { resolveVisual, visualKey } from "@/lib/lesson-engine/visuals";
import Chocolate from "./Chocolate";
import CompareCircles from "./CompareCircles";
import VisualByKind from "./VisualByKind";

interface SessionVisualProps {
  visual: VisualRef;
  selected: number[];
  choosing: boolean;
  onToggleSquare: (index: number) => void;
  onPickCompare: (value: string) => void;
  compareLabels?: Record<string, string>;
}

/** Draws a step's visual; the tappable kinds get their handlers here. No captions: the teacher's sentence is the caption. */
export default function SessionVisual({ visual, selected, choosing, onToggleSquare, onPickCompare, compareLabels }: SessionVisualProps) {
  const spec = resolveVisual(visual);
  const key = visualKey(visual);
  if (spec.kind === "chocolate" && spec.mode === "pick") {
    return <Chocolate key={key} mode="pick" selected={selected} canPick={choosing} onToggle={onToggleSquare} />;
  }
  if (spec.kind === "compare" && spec.pick) {
    return <CompareCircles key={key} canPick={choosing} onPick={onPickCompare} labels={compareLabels} />;
  }
  return (
    <div key={key} className="contents">
      <VisualByKind spec={spec} compareLabels={compareLabels} />
    </div>
  );
}
