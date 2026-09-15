import type { ExplainVisualId, VisualSpec } from "@/lib/lesson-engine/types";
import Pizza from "./Pizza";
import FractionGlyph from "./FractionGlyph";
import VisualByKind from "./VisualByKind";

/** Explanation visuals: the fractions ids (whole → half → quarter → glyph) or any visual spec. */
export default function ExplainVisual({ visual }: { visual: ExplainVisualId | VisualSpec }) {
  if (typeof visual !== "string") {
    return (
      <div key={JSON.stringify(visual)} className="contents">
        <VisualByKind spec={visual} />
      </div>
    );
  }
  switch (visual) {
    case "whole":
      return <Pizza key="whole" filled={0} dividers="none" />;
    case "half":
      return <Pizza key="half" filled={2} dividers="v" />;
    case "quarter":
      return <Pizza key="quarter" filled={1} dividers="vh" />;
    case "glyph":
      return (
        <div key="glyph" className="flex items-center gap-8 motion animate-pop-in">
          <FractionGlyph n="1" d="4" size={84} highlightNumerator />
          <div className="flex flex-col gap-[30px] text-[16px] text-ink-2">
            <div>
              <b className="text-primary">فوق:</b> كم أخذنا
            </div>
            <div>
              <b className="text-ink">تحت:</b> كم قسمنا
            </div>
          </div>
        </div>
      );
  }
}
