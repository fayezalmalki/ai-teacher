"use client";

import { GeminiLiveSession } from "./gemini";
import { MockLiveSession } from "./mock";
import type { LiveSession, LiveTokenResponse } from "./types";

export * from "./types";
export { GeminiLiveSession } from "./gemini";
export { MockLiveSession } from "./mock";

export class LiveUnavailableError extends Error {}

/**
 * Ask the server for a session: an ephemeral Gemini token, the mock, or a
 * reason it is off. Throws LiveUnavailableError when the feature is off.
 */
export async function createLiveSession(input: {
  lessonId: string;
  childName: string;
  endpoint?: string;
  forceMock?: boolean;
}): Promise<LiveSession> {
  const res = await fetch(input.endpoint ?? "/api/live/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lessonId: input.lessonId, childName: input.childName, mock: !!input.forceMock }),
  });
  const json = (await res.json().catch(() => ({}))) as Partial<LiveTokenResponse> & { error?: string };
  if (!res.ok || !json.provider || json.provider === "off") {
    throw new LiveUnavailableError(json.reason ?? json.error ?? `token ${res.status}`);
  }
  const limits = json.limits ?? { maxDurationMs: 120000, maxTurns: 3 };
  if (json.provider === "mock") {
    if (!json.script) throw new LiveUnavailableError("mock script missing");
    return new MockLiveSession({ script: json.script, limits });
  }
  if (!json.token || !json.wsUrl || !json.setup) throw new LiveUnavailableError("incomplete token response");
  return new GeminiLiveSession({
    wsUrl: json.wsUrl,
    token: json.token,
    setup: json.setup,
    kickoff: "(الطفل جاهز ويسمعك الآن. ابدأ بالترحيب.)",
    limits,
  });
}
