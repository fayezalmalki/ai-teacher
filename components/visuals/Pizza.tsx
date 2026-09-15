/**
 * v2 pizza: one hatch layer on the whole disc, cream quadrant masks over the
 * parts that are not highlighted (never per-quadrant gradients; they seam).
 * `filled` counts highlighted quarters clockwise from the top-right.
 */
interface PizzaProps {
  /** Highlighted quarters, 0–4. */
  filled: 0 | 1 | 2 | 3 | 4;
  dividers?: "none" | "v" | "vh";
  size?: number;
  shadow?: boolean;
  pop?: boolean;
  className?: string;
}

const QUADS: { top: string; left: string }[] = [
  { top: "0", left: "50%" },
  { top: "50%", left: "50%" },
  { top: "50%", left: "0" },
  { top: "0", left: "0" },
];

export default function Pizza({ filled, dividers = "v", size = 260, shadow = true, pop = true, className = "" }: PizzaProps) {
  return (
    <div className={"relative " + (pop ? "motion animate-pop-in " : "") + className} style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 r-pizza ink hatch bg-pizza overflow-hidden"
        style={{ boxShadow: shadow ? "8px 8px 0 var(--color-pizza-shadow)" : undefined }}
      >
        {QUADS.map((q, i) => (
          <div
            key={i}
            className="absolute w-1/2 h-1/2 transition-colors duration-[400ms]"
            style={{ top: q.top, left: q.left, background: i < filled ? "transparent" : "var(--color-pizza)" }}
          />
        ))}
        {dividers !== "none" && <div className="absolute top-0 bottom-0 left-1/2 w-[3px] -ml-[1.5px] bg-ink" />}
        {dividers === "vh" && <div className="absolute left-0 right-0 top-1/2 h-[3px] -mt-[1.5px] bg-ink" />}
      </div>
    </div>
  );
}
