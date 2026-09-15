import Image from "next/image";
import { site } from "@/lib/site";

/** Faint "Powered by MVP" mark (child home). */
export default function PoweredBy({ className = "" }: { className?: string }) {
  return (
    <a
      href={site.poweredBy.url}
      target="_blank"
      rel="noreferrer"
      className={"inline-flex items-center gap-2 text-faint text-[12px] hover:text-ink " + className}
    >
      <span>Powered by</span>
      <Image src={site.poweredBy.logo} alt={site.poweredBy.label} width={37} height={11} className="block h-[11px] w-auto opacity-60" />
    </a>
  );
}
