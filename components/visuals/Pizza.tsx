interface PizzaProps {
  size?: number;
  border?: number;
  /** Highlighted (blue) fraction of the pie, 0–1. */
  filled: number;
  /** Base color of the un-highlighted part. */
  base?: "pizza" | "eaten";
  /** Divider lines: 0 none, 1 vertical, 2 vertical + horizontal. */
  lines?: 0 | 1 | 2;
  fadeUp?: boolean;
  className?: string;
}

/** Pizza circle: crust border, cream base, highlighted portion via conic-gradient, 3px white dividers. */
export default function Pizza({ size = 220, border = 10, filled, base = "pizza", lines = 0, fadeUp, className = "" }: PizzaProps) {
  const baseColor = base === "eaten" ? "var(--color-pizza-eaten)" : "var(--color-pizza)";
  const pct = Math.round(filled * 100);
  const background =
    filled <= 0 ? baseColor : `conic-gradient(var(--color-accent) 0 ${pct}%, ${baseColor} ${pct}% 100%)`;
  return (
    <div
      className={"relative rounded-full " + (fadeUp ? "animate-[fadeUp_.4s_ease] " : "") + className}
      style={{
        width: size,
        height: size,
        border: `${border}px solid var(--color-pizza-crust)`,
        background,
        boxShadow: filled === 0.5 && base === "pizza" ? "inset 0 0 0 2px rgba(0,0,0,.04)" : undefined,
      }}
    >
      {lines >= 1 && <div className="absolute top-0 bottom-0 left-1/2 w-[3px] -ml-[1.5px] bg-white" />}
      {lines >= 2 && <div className="absolute left-0 right-0 top-1/2 h-[3px] -mt-[1.5px] bg-white" />}
    </div>
  );
}
