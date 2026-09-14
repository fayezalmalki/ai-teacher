"use client";

/**
 * App-level state: child profile, parent PIN, settings and the last session
 * result. Persisted to localStorage for the MVP; swap for Supabase later
 * (see lib/db/supabase.ts).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SessionResult } from "@/lib/lesson-engine/types";

export interface ChildProfile {
  name: string;
  age: number;
  grade: number;
}

export interface Settings {
  dailyMinutes: number;
  reminder: boolean;
}

export interface AppState {
  child: ChildProfile;
  /** 4-digit parent PIN. Prototype default is 1234. */
  pin: string;
  settings: Settings;
  lastResult: SessionResult | null;
  /** Set once onboarding finished at least once. */
  onboarded: boolean;
}

const STORAGE_KEY = "ai-teacher:v1";

export const DEFAULT_STATE: AppState = {
  child: { name: "سلمان", age: 9, grade: 3 },
  pin: "1234",
  settings: { dailyMinutes: 10, reminder: true },
  lastResult: null,
  onboarded: false,
};

interface AppStore {
  state: AppState;
  hydrated: boolean;
  setChild: (child: Partial<ChildProfile>) => void;
  setPin: (pin: string) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setLastResult: (result: SessionResult | null) => void;
  setOnboarded: (v: boolean) => void;
  childInitial: string;
}

const Ctx = createContext<AppStore | null>(null);

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      child: { ...DEFAULT_STATE.child, ...(parsed.child ?? {}) },
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode) */
    }
  }, [state, hydrated]);

  const setChild = useCallback((child: Partial<ChildProfile>) => {
    setState((s) => ({ ...s, child: { ...s.child, ...child } }));
  }, []);
  const setPin = useCallback((pin: string) => setState((s) => ({ ...s, pin })), []);
  const setSettings = useCallback((settings: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...settings } }));
  }, []);
  const setLastResult = useCallback((lastResult: SessionResult | null) => setState((s) => ({ ...s, lastResult })), []);
  const setOnboarded = useCallback((onboarded: boolean) => setState((s) => ({ ...s, onboarded })), []);

  const value = useMemo<AppStore>(
    () => ({
      state,
      hydrated,
      setChild,
      setPin,
      setSettings,
      setLastResult,
      setOnboarded,
      childInitial: (state.child.name || "س").trim().charAt(0) || "س",
    }),
    [state, hydrated, setChild, setPin, setSettings, setLastResult, setOnboarded],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
