import type { Tone } from "@/lib/content/catalog";

export const TONE_TILE: Record<Tone, string> = {
  blue: "bg-primary-tint text-primary",
  green: "bg-success-tint text-success",
  amber: "bg-warning-tint text-warning",
  neutral: "bg-surface-3 text-ink-2",
};

export const TONE_BAR: Record<Tone, string> = {
  blue: "bg-primary",
  green: "bg-success",
  amber: "bg-warning",
  neutral: "bg-ink-2",
};
