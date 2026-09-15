"use client";

/**
 * App-level state: the household's children (each with settings and session
 * history), the active child, the parent PIN. Persisted to localStorage for
 * the MVP and mirrored to the parent account when one is signed in (lib/convex/account.tsx).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SessionResult } from "@/lib/lesson-engine/types";
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  activeChild,
  appendResult,
  createChild,
  defaultState,
  fromStorage,
  initialOf,
  removeChildFrom,
  updateChildIn,
  type AppState,
  type AvatarColor,
  type ChildProfile,
  type ChildSettings,
} from "./state";

export type { AppState, AvatarColor, ChildProfile, ChildSettings, SoundMode } from "./state";
export { DEFAULT_SETTINGS } from "./state";

/** Settings alias kept for callers written against v1. */
export type Settings = ChildSettings;

interface AppStore {
  state: AppState;
  hydrated: boolean;
  /** The active child. */
  child: ChildProfile;
  settings: ChildSettings;
  results: SessionResult[];
  lastResult: SessionResult | null;
  childInitial: string;
  /** Update the active child's profile fields. */
  setChild: (child: Partial<Pick<ChildProfile, "name" | "age" | "grade" | "color">>) => void;
  /** Update the active child's settings. */
  setSettings: (settings: Partial<ChildSettings>) => void;
  addChild: (input: { name: string; age: number; grade: number; color?: AvatarColor }) => string;
  updateChild: (id: string, patch: Partial<Omit<ChildProfile, "id" | "results">>) => void;
  updateChildSettings: (id: string, settings: Partial<ChildSettings>) => void;
  removeChild: (id: string) => void;
  setActiveChild: (id: string) => void;
  addResult: (result: SessionResult) => void;
  setPin: (pin: string) => void;
  setOnboarded: (v: boolean) => void;
  /** Replace the whole household (used by account sync after a merge). */
  importState: (next: AppState) => void;
}

const Ctx = createContext<AppStore | null>(null);

function load(): AppState {
  try {
    return fromStorage(window.localStorage.getItem(STORAGE_KEY), window.localStorage.getItem(LEGACY_STORAGE_KEY));
  } catch {
    return defaultState();
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => defaultState(0));
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

  const setChild = useCallback<AppStore["setChild"]>((patch) => {
    setState((s) => updateChildIn(s, s.activeChildId, patch));
  }, []);
  const setSettings = useCallback<AppStore["setSettings"]>((settings) => {
    setState((s) => {
      const c = activeChild(s);
      return updateChildIn(s, c.id, { settings: { ...c.settings, ...settings } });
    });
  }, []);
  const addChild = useCallback<AppStore["addChild"]>((input) => {
    const child = createChild(input, []);
    setState((s) => {
      const withColor = { ...child, color: input.color ?? createChild(input, s.children).color };
      return { ...s, children: [...s.children, withColor], activeChildId: withColor.id };
    });
    return child.id;
  }, []);
  const updateChild = useCallback<AppStore["updateChild"]>((id, patch) => setState((s) => updateChildIn(s, id, patch)), []);
  const updateChildSettings = useCallback<AppStore["updateChildSettings"]>((id, settings) => {
    setState((s) => {
      const c = s.children.find((x) => x.id === id);
      return c ? updateChildIn(s, id, { settings: { ...c.settings, ...settings } }) : s;
    });
  }, []);
  const removeChild = useCallback<AppStore["removeChild"]>((id) => setState((s) => removeChildFrom(s, id)), []);
  const setActiveChild = useCallback<AppStore["setActiveChild"]>((id) => {
    setState((s) => (s.children.some((c) => c.id === id) ? { ...s, activeChildId: id } : s));
  }, []);
  const addResult = useCallback<AppStore["addResult"]>((result) => setState((s) => appendResult(s, s.activeChildId, result)), []);
  const setPin = useCallback((pin: string) => setState((s) => ({ ...s, pin })), []);
  const setOnboarded = useCallback((onboarded: boolean) => setState((s) => ({ ...s, onboarded })), []);
  const importState = useCallback((next: AppState) => setState(next), []);

  const value = useMemo<AppStore>(() => {
    const child = activeChild(state);
    return {
      state,
      hydrated,
      child,
      settings: child.settings,
      results: child.results,
      lastResult: child.results.length ? child.results[child.results.length - 1] : null,
      childInitial: initialOf(child.name),
      setChild,
      setSettings,
      addChild,
      updateChild,
      updateChildSettings,
      removeChild,
      setActiveChild,
      addResult,
      setPin,
      setOnboarded,
      importState,
    };
  }, [state, hydrated, setChild, setSettings, addChild, updateChild, updateChildSettings, removeChild, setActiveChild, addResult, setPin, setOnboarded, importState]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
