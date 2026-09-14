import Waveform from "./Waveform";

export type StatusTone = "primary" | "success" | "neutral";

const TONES: Record<StatusTone, string> = {
  primary: "bg-primary-tint text-primary",
  success: "bg-success-tint text-success",
  neutral: "bg-surface-3 text-ink-2",
};

interface StatusPillProps {
  label: string;
  tone: StatusTone;
  /** Show the animated waveform. */
  active: boolean;
}

export default function StatusPill({ label, tone, active }: StatusPillProps) {
  return (
    <div className={"flex items-center gap-2.5 px-3.5 py-2 rounded-pill text-[14px] font-medium " + TONES[tone]}>
      <Waveform active={active} />
      <span>{label}</span>
    </div>
  );
}
