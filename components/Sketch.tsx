import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

/**
 * Hand-drawn primitives (docs/README-v2.md): ink stroke, wobbly radius, flat
 * offset shadow, spring hover. Everything primary in the app is built from these.
 */

export const BTN_RADII = ["r-btn-1", "r-btn-2", "r-btn-3", "r-btn-4"] as const;
export const CARD_RADII = ["r-card-1", "r-card-2", "r-card-3"] as const;

export function btnRadius(index = 0) {
  return BTN_RADII[index % BTN_RADII.length];
}
export function cardRadius(index = 0) {
  return CARD_RADII[index % CARD_RADII.length];
}

type Variant = "primary" | "white" | "green" | "yellow";
type Size = "lg" | "md" | "sm" | "xs";

const FILL: Record<Variant, string> = {
  primary: "bg-primary text-white",
  white: "bg-surface text-ink",
  green: "bg-success text-white",
  yellow: "bg-yellow text-ink",
};
const SIZE: Record<Size, string> = {
  lg: "px-9 py-[18px] text-[22px]",
  md: "px-[30px] py-4 text-[20px]",
  sm: "px-6 py-3.5 text-[18px]",
  xs: "px-[22px] py-3 text-[15px]",
};

interface SketchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Cycles the wobbly radius so siblings never share one. */
  index?: number;
  href?: string;
  /** Delay the pop-in (seconds) for staggered rows. */
  popDelay?: number;
  pop?: boolean;
  children: ReactNode;
}

export function SketchButton({
  variant = "primary",
  size = "md",
  index = 0,
  href,
  popDelay,
  pop,
  className = "",
  children,
  type,
  style,
  ...rest
}: SketchButtonProps) {
  const cls = `inline-flex items-center justify-center gap-3 font-display font-bold leading-none ink ${btnRadius(index)} ${FILL[variant]} ${SIZE[size]} shadow-pop press ${pop ? "motion animate-pop-in" : ""} ${className}`;
  const st: CSSProperties = { ...style, animationDelay: popDelay !== undefined ? `${popDelay}s` : style?.animationDelay };
  if (href) {
    return (
      <Link href={href} className={cls + " hover:text-inherit"} style={st}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} className={cls} style={st} {...rest}>
      {children}
    </button>
  );
}

interface SketchCardProps {
  index?: number;
  tint?: "blue" | "yellow" | "green" | "cream" | "none";
  className?: string;
  children: ReactNode;
}

const TINT: Record<NonNullable<SketchCardProps["tint"]>, string> = {
  blue: "shadow-tint-blue",
  yellow: "shadow-tint-yellow",
  green: "shadow-tint-green",
  cream: "shadow-tint-cream",
  none: "",
};

export function SketchCard({ index = 0, tint = "blue", className = "", children }: SketchCardProps) {
  return <div className={`ink ${cardRadius(index)} bg-surface ${TINT[tint]} ${className}`}>{children}</div>;
}

interface SketchCircleProps {
  size: number;
  variant?: "avatar" | "pizza" | "dot";
  border?: 2 | 3;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
}

/** Ink-stroked wobbly circle. */
export function SketchCircle({ size, variant = "avatar", border = 3, className = "", style, children, onClick }: SketchCircleProps) {
  const r = variant === "pizza" ? "r-pizza" : variant === "dot" ? "r-dot" : "r-avatar";
  return (
    <div
      onClick={onClick}
      className={`${r} ${border === 3 ? "ink" : "ink-2"} bg-surface grid place-items-center ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {children}
    </div>
  );
}

interface SketchChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: ReactNode;
}

/** 48px selectable chip; selected = blue fill, white text. */
export function SketchChip({ selected, className = "", children, type, ...rest }: SketchChipProps) {
  return (
    <button
      type={type ?? "button"}
      aria-pressed={selected}
      className={`h-12 r-chip ink-2 font-semibold transition-colors ${selected ? "bg-primary text-white" : "bg-surface text-ink hover:bg-hover"} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Small round ink pill for corner chrome. */
export function SketchPill({ className = "", children, href, onClick }: { className?: string; children: ReactNode; href?: string; onClick?: () => void }) {
  const cls = `inline-flex items-center rounded-pill ink-2 bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-hover hover:text-ink ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Dashed-underline text link. */
export function SketchLink({ href, onClick, className = "", children }: { href?: string; onClick?: () => void; className?: string; children: ReactNode }) {
  const cls = `inline-block bg-transparent border-0 p-0 text-[15px] font-semibold text-primary border-b-2 border-dashed border-primary hover:text-primary-link-hover ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function DashedRule({ className = "" }: { className?: string }) {
  return <div className={"dashed-rule " + className} />;
}
