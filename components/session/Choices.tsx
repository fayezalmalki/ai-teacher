"use client";

import { SketchButton } from "@/components/Sketch";
import { toArabicDigits } from "@/lib/format";
import type { Choice } from "@/lib/lesson-engine/types";
import { isLatin } from "@/lib/format";

interface ChoicesProps {
  choices: Choice[];
  onPick: (index: number) => void;
  /** "en": labels stay in Western digits and read left-to-right. */
  lang?: "ar" | "en";
}

/** Answer buttons: Baloo 26, cycled wobbly radii, staggered pop-in. */
export default function Choices({ choices, onPick, lang }: ChoicesProps) {
  const latin = lang === "en";
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
          dir={latin || isLatin(c.l) ? "ltr" : undefined}
        >
          {latin || isLatin(c.l) ? c.l : toArabicDigits(c.l)}
        </SketchButton>
      ))}
    </>
  );
}
