"use client";

/**
 * Sends usage events to Convex for the admin page: one `visit` per browser
 * session (plus `first_visit` the first time a device is seen), a `page`
 * event per route change, and the lesson / onboarding events the analytics
 * buffer already emits. No names, emails or transcripts leave the device.
 * Renders nothing; inert without a Convex URL.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setAnalyticsSink } from "@/lib/analytics/events";
import { convexEnabled } from "@/lib/convex/config";

const DEVICE_KEY = "ai-teacher:device";
const VISIT_KEY = "ai-teacher:visited";

function deviceId(): { id: string; isNew: boolean } {
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return { id: existing, isNew: false };
    const id = "d_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
    window.localStorage.setItem(DEVICE_KEY, id);
    return { id, isNew: true };
  } catch {
    return { id: "d_anon" + Math.random().toString(36).slice(2, 10), isNew: false };
  }
}

function deviceType(): "mobile" | "desktop" {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700 ? "mobile" : "desktop";
}

function referrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).host;
    return host === window.location.host ? undefined : host;
  } catch {
    return undefined;
  }
}

export function Telemetry() {
  if (!convexEnabled()) return null;
  return <TelemetryInner />;
}

function TelemetryInner() {
  const track = useMutation(api.telemetry.track);
  const pathname = usePathname();
  const dev = useRef<{ id: string; isNew: boolean } | null>(null);
  const lastPath = useRef<string | null>(null);

  const send = useRef((kind: string, extra: { path?: string; lessonId?: string; ref?: string } = {}) => {
    if (!dev.current) dev.current = deviceId();
    track({ deviceId: dev.current.id, kind, device: deviceType(), ...extra }).catch(() => {});
  });

  // One visit per tab session; first_visit once per device.
  useEffect(() => {
    dev.current = deviceId();
    let visited = false;
    try {
      visited = window.sessionStorage.getItem(VISIT_KEY) === "1";
      window.sessionStorage.setItem(VISIT_KEY, "1");
    } catch {}
    if (dev.current.isNew) send.current("first_visit", { path: window.location.pathname });
    if (!visited) send.current("visit", { path: window.location.pathname, ref: referrerHost() });
    lastPath.current = window.location.pathname;
  }, []);

  // Route changes after the first paint.
  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    send.current("page", { path: pathname });
  }, [pathname]);

  // Lesson and onboarding events from the analytics buffer.
  useEffect(() => {
    setAnalyticsSink((e) => {
      if (e.name === "session_started") send.current("lesson_start", { lessonId: e.lessonId });
      else if (e.name === "session_ended") send.current("lesson_end", { lessonId: e.lessonId });
      else if (e.name === "onboarded") send.current("onboarded");
    });
    return () => setAnalyticsSink(null);
  }, []);

  return null;
}
