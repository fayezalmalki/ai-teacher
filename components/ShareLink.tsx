"use client";

import { useState } from "react";
import QrCode from "./QrCode";
import { SketchButton } from "./Sketch";
import { whatsappUrl } from "@/lib/store/links";

interface ShareLinkProps {
  url: string;
  code: string;
  /** Message sent with the link on WhatsApp. */
  message: string;
  qr?: boolean;
  compact?: boolean;
}

/** The link, its code in big type, copy and WhatsApp buttons, and a QR. */
export default function ShareLink({ url, code, message, qr = true, compact = false }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className={"flex gap-5 flex-wrap items-start " + (compact ? "" : "px-5 py-4 r-card-1 ink-2 bg-surface")}>
      <div className="flex flex-col gap-2.5 min-w-0 flex-1">
        <div className="font-display font-bold tracking-[0.18em] text-ink" style={{ fontSize: compact ? 28 : 36 }} dir="ltr" data-testid="share-code">
          {code}
        </div>
        <a href={url} className="text-[14px] text-primary break-all" dir="ltr" data-testid="share-url">
          {url}
        </a>
        <div className="flex gap-2 flex-wrap">
          <SketchButton size="xs" onClick={copy}>
            {copied ? "نُسخ" : "نسخ الرابط"}
          </SketchButton>
          <a href={whatsappUrl(`${message}\n${url}`)} target="_blank" rel="noreferrer" className="inline-flex items-center whitespace-nowrap rounded-pill ink-2 bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-hover hover:text-ink">
            واتساب
          </a>
        </div>
      </div>
      {qr && <QrCode value={url} size={compact ? 120 : 150} />}
    </div>
  );
}
