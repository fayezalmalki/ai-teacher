"use client";

import type { VisualSpec } from "@/lib/lesson-engine/types";
import Pizza from "./Pizza";
import { FractionPair } from "./FractionGlyph";
import Chocolate from "./Chocolate";
import CompareCircles from "./CompareCircles";
import NumberBlocks from "./NumberBlocks";
import NumberLine from "./NumberLine";
import Ruler from "./Ruler";
import Balance from "./Balance";
import Cycle from "./Cycle";
import WordCard from "./WordCard";
import Cards from "./Cards";

/** Draws a visual spec without interaction. SessionVisual wraps the tappable kinds. */
export default function VisualByKind({ spec, compareLabels }: { spec: VisualSpec; compareLabels?: Record<string, string> }) {
  switch (spec.kind) {
    case "pizza":
      return <Pizza filled={spec.filled} dividers={spec.dividers} />;
    case "fractions":
      return <FractionPair pairs={spec.pairs} />;
    case "chocolate":
      return <Chocolate mode={spec.mode === "pick" ? "two" : spec.mode} />;
    case "compare":
      return <CompareCircles labels={compareLabels} />;
    case "blocks":
      return <NumberBlocks value={spec.value} highlight={spec.highlight} />;
    case "numberline":
      return <NumberLine from={spec.from} to={spec.to} step={spec.step} start={spec.start} jump={spec.jump} />;
    case "ruler":
      return <Ruler length={spec.length} max={spec.max} label={spec.label} />;
    case "balance":
      return <Balance left={spec.left} right={spec.right} leftLabel={spec.leftLabel} rightLabel={spec.rightLabel} />;
    case "cycle":
      return <Cycle stages={spec.stages} highlight={spec.highlight} />;
    case "word":
      return <WordCard text={spec.text} marks={spec.marks} caption={spec.caption} />;
    case "cards":
      return <Cards items={spec.items} highlight={spec.highlight} numbered={spec.numbered} />;
    default:
      return null;
  }
}
