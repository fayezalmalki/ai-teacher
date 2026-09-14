import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "success" | "pill" | "link";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-0 rounded-input bg-primary text-white font-semibold shadow-primary hover:bg-primary-hover hover:text-white",
  secondary: "border-2 border-border-2 rounded-input bg-surface text-ink font-semibold hover:bg-surface-3 hover:text-ink",
  success:
    "border-0 rounded-input bg-success text-white font-semibold shadow-success hover:bg-success-hover hover:text-white",
  pill: "border border-border-2 rounded-pill bg-surface text-ink-2 hover:bg-surface-3 hover:text-ink-2",
  link: "bg-transparent border-0 p-0 text-primary font-medium hover:text-primary-link-hover",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
  children: ReactNode;
}

/** Shared button. Pass padding/font-size via className (sizes vary per screen). */
export default function Button({ variant = "primary", href, className = "", children, type, ...rest }: ButtonProps) {
  const cls = "inline-flex items-center justify-center gap-2 " + VARIANTS[variant] + " " + className;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} className={cls} {...rest}>
      {children}
    </button>
  );
}
