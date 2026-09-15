"use client";

import type { VisualRef } from "@/lib/lesson-engine/types";
import { resolveVisual, visualKey } from "@/lib/lesson-engine/visuals";
import Pizza from "./Pizza";
import { FractionPair } from "./FractionGlyph";
import Chocolate from "./Chocolate";
import CompareCircles from "./CompareCircles";

interface SessionVisualProps {
  visual: VisualRef;
  selected: number[];
  choosing: boolean;
  onToggleSquare: (index: number) => void;
  onPickCompare: (value: string) => void;
  compareLabels?: Record<string, string>;
}

/** Draws a step's visual by kind. No captions: the teacher's sentence is the caption. */
export default function SessionVisual({ visual, selected, choosing, onToggleSquare, onPickCompare, compareLabels }: SessionVisualProps) {
  const spec = resolveVisual(visual);
  const key = visualKey(visual);
  switch (spec.kind) {
    case "pizza":
      return <Pizza key={key} filled={spec.filled} dividers={spec.dividers} />;
    case "fractions":
      return <FractionPair key={key} pairs={spec.pairs} />;
    case "chocolate":
      return spec.mode === "pick" ? (
        <Chocolate key={key} mode="pick" selected={selected} canPick={choosing} onToggle={onToggleSquare} />
      ) : (
        <Chocolate key={key} mode={spec.mode} />
      );
    case "compare":
      return spec.pick ? (
        <CompareCircles key={key} canPick={choosing} onPick={onPickCompare} labels={compareLabels} />
      ) : (
        <CompareCircles key={key} labels={compareLabels} />
      );
    default:
      return null;
  }
}
