"use client";

import type { VisualId } from "@/lib/lesson-engine/types";
import Pizza from "./Pizza";
import { FractionPair } from "./FractionGlyph";
import Chocolate from "./Chocolate";
import CompareCircles from "./CompareCircles";

interface SessionVisualProps {
  visual: VisualId;
  selected: number[];
  /** Teacher is waiting for an answer, so tappable visuals accept input. */
  choosing: boolean;
  onToggleSquare: (index: number) => void;
  onPickCompare: (value: string) => void;
  compareLabels?: Record<string, string>;
}

/** Maps a `visual` id from the lesson JSON to a component. */
export default function SessionVisual({
  visual,
  selected,
  choosing,
  onToggleSquare,
  onPickCompare,
  compareLabels,
}: SessionVisualProps) {
  switch (visual) {
    case "pizzaHalf":
      return (
        <div className="flex flex-col items-center gap-[18px]">
          <Pizza filled={0.5} lines={1} />
          <div className="text-[15px] text-muted">بيتزا مقسومة إلى جزأين متساويين</div>
        </div>
      );
    case "pizza34":
      return (
        <div className="flex flex-col items-center gap-[18px]">
          <Pizza filled={0.25} base="eaten" lines={2} />
          <div className="text-[15px] text-muted">3 أرباع أُكلت · جزء واحد باقي</div>
        </div>
      );
    case "fractions":
      return (
        <FractionPair
          pairs={[
            { n: "1", d: "2" },
            { n: "1", d: "4" },
          ]}
        />
      );
    case "fractions34":
      return (
        <FractionPair
          pairs={[
            { n: "3", d: "4" },
            { n: "1", d: "2" },
          ]}
        />
      );
    case "chocOne":
      return <Chocolate mode="one" />;
    case "chocTwo":
      return <Chocolate mode="two" />;
    case "chocPick":
      return <Chocolate mode="pick" selected={selected} canPick={choosing} onToggle={onToggleSquare} />;
    case "compare":
      return <CompareCircles labels={compareLabels} />;
    case "comparePick":
      return <CompareCircles canPick={choosing} onPick={onPickCompare} labels={compareLabels} />;
    default:
      return null;
  }
}
