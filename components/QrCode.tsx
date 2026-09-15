"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** A QR image for a URL, drawn in the app's ink on white. */
export default function QrCode({ value, size = 160, className = "" }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: "#23272a", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);
  if (!src) return <div className={"bg-surface r-card-2 ink-2 " + className} style={{ width: size, height: size }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={`رمز QR للرابط ${value}`} className={"r-card-2 ink-2 bg-white " + className} style={{ width: size, height: size }} />;
}
