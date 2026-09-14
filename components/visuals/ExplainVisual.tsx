import type { ExplainVisualId } from "@/lib/lesson-engine/types";
import Pizza from "./Pizza";
import FractionGlyph from "./FractionGlyph";

/** Visuals for the avatar explanation mode: whole → half → quarter → fraction glyph with legend. */
export default function ExplainVisual({ visual }: { visual: ExplainVisualId }) {
  switch (visual) {
    case "whole":
      return <Pizza key="whole" filled={0} fadeUp />;
    case "half":
      return <Pizza key="half" filled={0.5} lines={1} fadeUp />;
    case "quarter":
      return <Pizza key="quarter" filled={0.25} lines={2} fadeUp />;
    case "glyph":
      return (
        <div key="glyph" className="flex items-center gap-7 animate-[fadeUp_.4s_ease]">
          <FractionGlyph n="1" d="4" size={64} highlightNumerator />
          <div className="flex flex-col gap-[22px] text-[15px] text-ink-2">
            <div>
              <span className="text-primary font-semibold">فوق:</span> كم أخذنا
            </div>
            <div>
              <span className="font-semibold">تحت:</span> كم قسمنا
            </div>
          </div>
        </div>
      );
  }
}
