"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ShareLink from "@/components/ShareLink";
import { SketchButton, SketchPill } from "@/components/Sketch";
import { useAccount } from "@/lib/convex/account";
import { joinUrl } from "@/lib/links/code";
import { relativeDay } from "@/lib/store/insights";
import type { ChildProfile } from "@/lib/store/state";

/** "رابط الطالب": mint the child's 5-char link, share it, and see or disconnect the devices that used it. */
export default function ChildLinkSection({ child }: { child: ChildProfile }) {
  const acct = useAccount();
  const create = useMutation(api.links.createChildLink);
  const revoke = useMutation(api.links.revokeDevice);
  const devices = useQuery(api.links.childDevices, acct.account ? { token: acct.account.token } : "skip");
  const [link, setLink] = useState<{ code: string; expiresAt: number; childId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!acct.enabled) return null;

  const mine = (devices ?? []).filter((d) => d.childClientId === child.id);
  const current = link && link.childId === child.id ? link : null;

  const mint = async () => {
    if (!acct.account) return;
    setBusy(true);
    try {
      const r = await create({ token: acct.account.token, childClientId: child.id });
      setLink({ ...r, childId: child.id });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 dashed-rule pt-7">
      <div className="text-[15px] font-semibold">جهاز {child.name}</div>
      {!acct.account ? (
        <div className="text-[14px] text-ink-2 leading-[1.7]">سجّل دخول حسابك (تحت) ثم أنشئ رابطًا يربط جوال {child.name} أو جهازه بهذا الحساب، فتوصلك جلساته هنا.</div>
      ) : (
        <>
          <div className="text-[14px] text-ink-2 leading-[1.7]">افتح الرابط على جهاز {child.name} مرة واحدة: يصير جهازه، ودروسه توصلك هنا. الرابط صالح ٧ أيام.</div>
          {current ? (
            <ShareLink
              url={joinUrl(window.location.origin, current.code)}
              code={current.code}
              message={`هذا رابط ${child.name} في المعلم الذكي، افتحه على جهازه:`}
            />
          ) : (
            <SketchButton size="sm" onClick={mint} disabled={busy} className="self-start" data-testid="mint-link">
              {busy ? "ينشئ…" : "أنشئ رابط الطالب"}
            </SketchButton>
          )}
          {mine.length > 0 && (
            <div className="flex flex-col gap-2 text-[14px]">
              <div className="text-muted">الأجهزة المرتبطة</div>
              {mine.map((d) => (
                <div key={d.id} className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold">{d.label || "جهاز"}</span>
                  <span className="text-muted">ربط {relativeDay(d.createdAt)} · آخر نشاط {relativeDay(d.lastSeenAt)}</span>
                  <SketchPill onClick={() => acct.account && revoke({ token: acct.account.token, deviceTokenId: d.id })} className="text-error">
                    فصل
                  </SketchPill>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
