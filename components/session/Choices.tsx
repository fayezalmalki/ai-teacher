"use client";

import { SketchButton } from "@/components/Sketch";
import { toArabicDigits } from "@/lib/format";
import type { Choice } from "@/lib/lesson-engine/types";

interface ChoicesProps {
  choices: Choice[];
  onPick: (index: number) => void;
}

/** Answer buttons: Baloo 26, cycled wobbly radii, staggered pop-in. */
export default function Choices({ choices, onPick }: ChoicesProps) {
  return (
    <>
      {choices.map((c, i) => (
        <SketchButton
          key={i}
          variant="white"
          index={i}
          pop
          popDelay={i * 0.08}
          onClick={() => onPick(i)}
          className="min-w-[130px] text-[26px] hover:bg-primary-tint"
        >
          {toArabicDigits(c.l)}
        </SketchButton>
      ))}
    </>
  );
}
