import Image from "next/image";
import { site } from "@/lib/site";

interface FooterProps {
  /** full: links + socials + powered-by + copyright (landing). slim: links + powered-by (parent). */
  variant?: "full" | "slim";
  className?: string;
}

/** Site footer; every link comes from lib/site.ts. */
export default function Footer({ variant = "full", className = "" }: FooterProps) {
  const powered = (
    <a
      href={site.poweredBy.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 text-muted text-[13px] hover:text-ink"
    >
      <span>تم التطوير بواسطة</span>
      <Image src={site.poweredBy.logo} alt={site.poweredBy.label} width={47} height={14} className="block h-3.5 w-auto" />
    </a>
  );
  if (variant === "slim") {
    return (
      <div className={"flex justify-between items-center gap-4 flex-wrap dashed-rule pt-6 " + className}>
        <div className="flex gap-[18px] flex-wrap">
          {site.links.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] text-muted hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>
        {powered}
      </div>
    );
  }
  return (
    <div className={"flex flex-col gap-[22px] dashed-rule pt-8 " + className}>
      <div className="flex justify-between items-center gap-5 flex-wrap">
        <div className="flex gap-[22px] flex-wrap">
          {site.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] font-medium text-ink border-b-2 border-dashed border-transparent hover:border-primary hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </div>
        {site.social.length > 0 && (
          <div className="flex gap-3.5">
            {site.social.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-muted hover:text-ink">
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-between items-center gap-4 flex-wrap">
        {powered}
        <div className="text-[12px] text-faint">{site.copyright}</div>
      </div>
    </div>
  );
}
