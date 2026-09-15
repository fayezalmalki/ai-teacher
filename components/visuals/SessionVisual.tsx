"use client";

import type { VisualId } from "@/lib/lesson-engine/types";
import Pizza from "./Pizza";
import { FractionPair } from "./FractionGlyph";
import Chocolate from "./Chocolate";
import CompareCircles from "./CompareCircles";

interface SessionVisualProps {
  visual: VisualId;
  selected: number[];
  choosing: boolean;
  onToggleSquare: (index: number) => void;
  onPickCompare: (value: string) => void;
  compareLabels?: Record<string, string>;
}

/** Maps a `visual` id from the lesson JSON to a v2 component. No captions: the teacher's sentence is the caption. */
export default function SessionVisual({ visual, selected, choosing, onToggleSquare, onPickCompare, compareLabels }: SessionVisualProps) {
  switch (visual) {
    case "pizzaHalf":
      return <Pizza key="half" filled={2} dividers="v" />;
    case "pizza34":
      return <Pizza key="34" filled={3} dividers="vh" />;
    case "fractions":
      return <FractionPair key="f" pairs={[{ n: "1", d: "2" }, { n: "1", d: "4" }]} />;
    case "fractions34":
      return <FractionPair key="f34" pairs={[{ n: "3", d: "4" }, { n: "1", d: "2" }]} />;
    case "chocOne":
      return <Chocolate key="c1" mode="one" />;
    case "chocTwo":
      return <Chocolate key="c2" mode="two" />;
    case "chocPick":
      return <Chocolate key="cp" mode="pick" selected={selected} canPick={choosing} onToggle={onToggleSquare} />;
    case "compare":
      return <CompareCircles key="cmp" labels={compareLabels} />;
    case "comparePick":
      return <CompareCircles key="cmpp" canPick={choosing} onPick={onPickCompare} labels={compareLabels} />;
    default:
      return null;
  }
}
