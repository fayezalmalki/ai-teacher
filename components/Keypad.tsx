"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

interface KeypadProps {
  onKey: (key: string) => void;
  disabled?: boolean;
}

/** 3×72px LTR numeric keypad, 64px keys. */
export function Keypad({ onKey, disabled }: KeypadProps) {
  return (
    <div className="grid grid-cols-[repeat(3,72px)] gap-2.5" dir="ltr">
      {KEYS.map((k, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled || k === ""}
          onClick={() => onKey(k)}
          aria-label={k === "⌫" ? "حذف" : k}
          className="h-16 rounded-tile border border-border-2 bg-surface text-[22px] font-semibold text-ink hover:bg-surface-3 disabled:hover:bg-surface"
          style={{ visibility: k === "" ? "hidden" : "visible" }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

interface PinDotsProps {
  length: number;
  error?: boolean;
  total?: number;
}

/** 4 × 18px dots: filled primary, empty border, red on error. */
export function PinDots({ length, error, total = 4 }: PinDotsProps) {
  return (
    <div className="flex gap-3.5" dir="ltr" aria-live="polite">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={
            "w-[18px] h-[18px] rounded-full transition-colors duration-200 " +
            (error ? "bg-error" : i < length ? "bg-primary" : "bg-border-2")
          }
        />
      ))}
    </div>
  );
}
