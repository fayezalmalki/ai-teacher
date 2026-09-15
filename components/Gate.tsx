"use client";

/**
 * The demo wall. The admin sets the gate on /admin: open (default), code
 * (visitors type an access code once per device) or closed (a message and
 * the contact link). /admin is never gated; a device holding a parent or
 * class link, and the join page itself, pass a code gate (they were invited).
 * Inert without a Convex URL.
 */
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { convexEnabled } from "@/lib/convex/config";
import { useLinks } from "@/lib/convex/links";
import { site } from "@/lib/site";
import Frame from "./Frame";
import Teacher from "./Teacher";
import { SketchButton } from "./Sketch";

const CODE_KEY = "ai-teacher:gate-code";

export default function Gate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!convexEnabled() || pathname?.startsWith("/admin")) return <>{children}</>;
  return <GateInner pathname={pathname ?? ""}>{children}</GateInner>;
}

function GateInner({ children, pathname }: { children: ReactNode; pathname: string }) {
  const status = useQuery(api.gate.status);
  const { links, loaded } = useLinks();
  const invited = (loaded && (!!links.parent || links.classes.length > 0)) || pathname.startsWith("/j/");
  const [code, setCode] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [tried, setTried] = useState(false);
  useEffect(() => {
    try {
      setCode(window.localStorage.getItem(CODE_KEY) ?? "");
    } catch {}
  }, []);
  const allowed = useQuery(api.gate.check, status && status.mode === "code" ? { code } : "skip");

  // Still loading: render the app (the wall replaces it a moment later if needed).
  if (status === undefined) return <>{children}</>;
  if (status.mode === "open") return <>{children}</>;
  if (status.mode === "code" && (invited || allowed === true)) return <>{children}</>;

  const submit = () => {
    const c = draft.trim();
    try {
      window.localStorage.setItem(CODE_KEY, c);
    } catch {}
    setCode(c);
    setTried(true);
  };
  const wrong = tried && allowed === false && code === draft.trim() && draft.trim().length > 0;

  return (
    <Frame>
      <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-16 pb-20">
        <div className="flex flex-col items-center gap-6 text-center max-w-[480px] w-full">
          <Teacher size={130} idleWobble />
          <h1 className="font-display text-[34px] sm:text-[40px] font-bold leading-[1.25] m-0">{site.name}</h1>
          {status.mode === "closed" ? (
            <>
              <p className="text-[18px] leading-[1.7] text-ink-2 m-0">{status.message || "النموذج مغلق حاليًا. نرجع قريبًا."}</p>
              <a href={site.contact} className="text-[15px] font-semibold text-primary">
                تواصل معنا
              </a>
            </>
          ) : (
            <>
              <p className="text-[18px] leading-[1.7] text-ink-2 m-0">{status.message || "النموذج متاح بدعوة. أدخل رمز الدخول للمتابعة."}</p>
              <form
                className="flex gap-2.5 flex-wrap justify-center w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <input
                  id="gate-code"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="رمز الدخول"
                  aria-label="رمز الدخول"
                  autoComplete="off"
                  className="min-w-0 w-[220px] px-4 py-3 r-input ink bg-surface text-[18px] text-center font-display font-semibold outline-none placeholder:text-faint placeholder:font-normal focus:shadow-[4px_4px_0_var(--color-primary-tint)]"
                />
                <SketchButton type="submit" disabled={!draft.trim()}>
                  دخول
                </SketchButton>
              </form>
              {wrong && <div className="text-[14px] text-error">الرمز غير صحيح.</div>}
              <a href={site.contact} className="text-[14px] text-muted">
                ما عندك رمز؟ تواصل معنا
              </a>
            </>
          )}
        </div>
      </div>
    </Frame>
  );
}
