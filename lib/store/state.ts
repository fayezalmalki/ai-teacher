/**
 * App state v2: a household of children on one device. Pure functions only;
 * the React provider in app-store.tsx wraps these. Persisted to localStorage
 * under STORAGE_KEY; v1 (single child) is migrated on first load.
 */
import type { SessionResult } from "@/lib/lesson-engine/types";

export const STORAGE_KEY = "ai-teacher:v2";
export const LEGACY_STORAGE_KEY = "ai-teacher:v1";
/** Results kept per child (newest last). */
export const MAX_RESULTS = 50;

export type SoundMode = "voice" | "reading";
export type AvatarColor = "yellow" | "blue" | "green" | "cream";
export const AVATAR_COLORS: AvatarColor[] = ["yellow", "blue", "green", "cream"];

export interface ChildSettings {
  dailyMinutes: number;
  reminder: boolean;
  /** Allow the open "ask the teacher" conversation (streams the child's voice to the live model). */
  liveAsk: boolean;
  /** voice = spoken lessons with the mic; reading = no sound, tap to advance, tap to answer. */
  sound: SoundMode;
  /** Difficulty the next session starts at (1 = the lesson's first level). */
  startLevel: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  grade: number;
  color: AvatarColor;
  settings: ChildSettings;
  /** Finished sessions, oldest first. */
  results: SessionResult[];
  createdAt: number;
  /** Last profile or settings edit; the account keeps the newer copy. */
  updatedAt?: number;
}

export interface AppState {
  version: 2;
  children: ChildProfile[];
  activeChildId: string;
  /** 4-digit parent PIN. Prototype default is 1234. */
  pin: string;
  /** Set once onboarding finished at least once. */
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: ChildSettings = {
  dailyMinutes: 10,
  reminder: true,
  liveAsk: true,
  sound: "voice",
  startLevel: 1,
};

/** The demo persona every fresh device starts with. */
export const DEMO_CHILD = { name: "سلمان", age: 9, grade: 3 };

export function newId(): string {
  return "c_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function nextColor(existing: ChildProfile[]): AvatarColor {
  const used = existing.map((c) => c.color);
  return AVATAR_COLORS.find((c) => !used.includes(c)) ?? AVATAR_COLORS[existing.length % AVATAR_COLORS.length];
}

export function createChild(
  input: { name: string; age: number; grade: number; color?: AvatarColor; settings?: Partial<ChildSettings> },
  existing: ChildProfile[] = [],
  now = Date.now(),
): ChildProfile {
  return {
    id: newId(),
    name: input.name.trim(),
    age: input.age,
    grade: input.grade,
    color: input.color ?? nextColor(existing),
    settings: { ...DEFAULT_SETTINGS, ...(input.settings ?? {}) },
    results: [],
    createdAt: now,
  };
}

export function defaultState(now = Date.now()): AppState {
  const child = createChild(DEMO_CHILD, [], now);
  return { version: 2, children: [child], activeChildId: child.id, pin: "1234", onboarded: false };
}

export function activeChild(state: AppState): ChildProfile {
  return state.children.find((c) => c.id === state.activeChildId) ?? state.children[0];
}

export function initialOf(name: string): string {
  return (name || "س").trim().charAt(0) || "س";
}

/** v1 shape (single child), kept only for migration. */
interface LegacyState {
  child?: { name?: string; age?: number; grade?: number };
  pin?: string;
  settings?: Partial<Pick<ChildSettings, "dailyMinutes" | "reminder" | "liveAsk">>;
  lastResult?: SessionResult | null;
  onboarded?: boolean;
}

/** Turn a v1 record into v2: one child carrying the old settings and last result. */
export function migrateLegacy(raw: LegacyState, now = Date.now()): AppState {
  const child = createChild(
    {
      name: raw.child?.name || DEMO_CHILD.name,
      age: raw.child?.age ?? DEMO_CHILD.age,
      grade: raw.child?.grade ?? DEMO_CHILD.grade,
      settings: raw.settings ?? {},
    },
    [],
    now,
  );
  if (raw.lastResult) child.results = [raw.lastResult];
  return { version: 2, children: [child], activeChildId: child.id, pin: raw.pin || "1234", onboarded: !!raw.onboarded };
}

/** Fill gaps in a stored v2 record (new settings keys, missing colors). */
export function normalize(raw: Partial<AppState>, now = Date.now()): AppState {
  const base = defaultState(now);
  const children = (raw.children ?? [])
    .filter((c): c is ChildProfile => !!c && typeof c.name === "string")
    .map((c, i, all) => ({
      ...c,
      id: c.id || newId(),
      color: c.color ?? nextColor(all.slice(0, i)),
      settings: { ...DEFAULT_SETTINGS, ...(c.settings ?? {}) },
      results: Array.isArray(c.results) ? c.results.slice(-MAX_RESULTS) : [],
      createdAt: c.createdAt ?? now,
    }));
  if (children.length === 0) return { ...base, pin: raw.pin || base.pin, onboarded: !!raw.onboarded };
  const activeChildId = children.some((c) => c.id === raw.activeChildId) ? raw.activeChildId! : children[0].id;
  return { version: 2, children, activeChildId, pin: raw.pin || base.pin, onboarded: !!raw.onboarded };
}

/** Parse whatever is in storage (v2, v1 or nothing) into a v2 state. */
export function fromStorage(v2: string | null, v1: string | null, now = Date.now()): AppState {
  try {
    if (v2) return normalize(JSON.parse(v2) as Partial<AppState>, now);
  } catch {
    /* fall through */
  }
  try {
    if (v1) return migrateLegacy(JSON.parse(v1) as LegacyState, now);
  } catch {
    /* fall through */
  }
  return defaultState(now);
}

export function updateChildIn(state: AppState, id: string, patch: Partial<Omit<ChildProfile, "id">>, now = Date.now()): AppState {
  return { ...state, children: state.children.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now } : c)) };
}

export function appendResult(state: AppState, id: string, result: SessionResult): AppState {
  return {
    ...state,
    children: state.children.map((c) => (c.id === id ? { ...c, results: [...c.results, result].slice(-MAX_RESULTS) } : c)),
  };
}

export function removeChildFrom(state: AppState, id: string): AppState {
  const children = state.children.filter((c) => c.id !== id);
  if (children.length === 0) return { ...state, ...defaultState(), pin: state.pin, onboarded: state.onboarded };
  const activeChildId = state.activeChildId === id ? children[0].id : state.activeChildId;
  return { ...state, children, activeChildId };
}
