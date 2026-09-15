/**
 * Reconciling the device's household with the account's copy. Pure, so the
 * sync hook and the tests share it. Children merge by id (newer updatedAt
 * wins, results union by lesson + start time); the active child is kept when
 * it still exists.
 */
import type { SessionResult } from "@/lib/lesson-engine/types";
import { DEMO_CHILD, MAX_RESULTS, nextColor, type AppState, type AvatarColor, type ChildProfile, type ChildSettings, DEFAULT_SETTINGS } from "./state";

export interface RemoteChild {
  clientId: string;
  name: string;
  age: number;
  grade: number;
  color: string;
  settings: unknown;
  createdAt: number;
  updatedAt?: number;
}

export interface RemoteResult extends Omit<SessionResult, "childName"> {
  childClientId: string;
}

export interface RemoteHousehold {
  children: RemoteChild[];
  results: RemoteResult[];
}

export function resultKey(r: Pick<SessionResult, "lessonId" | "startedAt" | "endedAt">): string {
  return `${r.lessonId}:${r.startedAt ?? r.endedAt ?? 0}`;
}

/** What the device sends: every child with its history, flattened. */
export function toRemote(state: AppState, childName?: (c: ChildProfile) => string): RemoteHousehold {
  void childName;
  return {
    children: state.children.map((c) => ({
      clientId: c.id,
      name: c.name,
      age: c.age,
      grade: c.grade,
      color: c.color,
      settings: c.settings,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt ?? c.createdAt,
    })),
    results: state.children.flatMap((c) =>
      c.results.map((r) => {
        const { childName: _n, ...rest } = r;
        void _n;
        return { ...rest, childClientId: c.id };
      }),
    ),
  };
}

const COLORS: AvatarColor[] = ["yellow", "blue", "green", "cream"];

/**
 * A device nobody has used yet: only the untouched demo child, no sessions,
 * onboarding never finished. Signing in on it adopts the account's children
 * instead of adding one more "سلمان" to the household.
 */
export function isPristine(local: AppState): boolean {
  if (local.onboarded || local.children.length !== 1) return false;
  const c = local.children[0];
  return c.name === DEMO_CHILD.name && c.results.length === 0 && !c.updatedAt;
}

/** Merge the account's household into the device's state. */
export function mergeRemote(local: AppState, remote: RemoteHousehold): AppState {
  const base = isPristine(local) && remote.children.length > 0 ? { ...local, children: [] as ChildProfile[] } : local;
  const byId = new Map<string, ChildProfile>(base.children.map((c) => [c.id, c]));
  const order: string[] = base.children.map((c) => c.id);
  for (const rc of remote.children) {
    const existing = byId.get(rc.clientId);
    const remoteUpdated = rc.updatedAt ?? rc.createdAt;
    const settings: ChildSettings = { ...DEFAULT_SETTINGS, ...((rc.settings as Partial<ChildSettings>) ?? {}) };
    const color: AvatarColor = COLORS.includes(rc.color as AvatarColor) ? (rc.color as AvatarColor) : nextColor([...byId.values()]);
    if (!existing) {
      byId.set(rc.clientId, { id: rc.clientId, name: rc.name, age: rc.age, grade: rc.grade, color, settings, results: [], createdAt: rc.createdAt, updatedAt: remoteUpdated });
      order.push(rc.clientId);
    } else if (remoteUpdated > (existing.updatedAt ?? existing.createdAt)) {
      byId.set(rc.clientId, { ...existing, name: rc.name, age: rc.age, grade: rc.grade, color, settings, updatedAt: remoteUpdated });
    }
  }
  for (const rr of remote.results) {
    const child = byId.get(rr.childClientId);
    if (!child) continue;
    const keys = new Set(child.results.map(resultKey));
    if (keys.has(resultKey(rr))) continue;
    const { childClientId: _c, ...rest } = rr;
    void _c;
    const merged = [...child.results, { ...rest, childName: child.name }]
      .sort((a, b) => (a.endedAt ?? a.startedAt ?? 0) - (b.endedAt ?? b.startedAt ?? 0))
      .slice(-MAX_RESULTS);
    byId.set(child.id, { ...child, results: merged });
  }
  const children = order.map((id) => byId.get(id)!);
  const activeChildId = children.some((c) => c.id === local.activeChildId) ? local.activeChildId : children[0].id;
  return { ...local, children, activeChildId };
}

/** True when the device holds something the account copy does not. */
export function hasLocalChanges(local: AppState, remote: RemoteHousehold): boolean {
  if (isPristine(local) && remote.children.length > 0) return false;
  const remoteChildren = new Map(remote.children.map((c) => [c.clientId, c]));
  const remoteKeys = new Set(remote.results.map((r) => `${r.childClientId}|${resultKey(r)}`));
  for (const c of local.children) {
    const rc = remoteChildren.get(c.id);
    if (!rc) return true;
    if ((c.updatedAt ?? c.createdAt) > (rc.updatedAt ?? rc.createdAt)) return true;
    for (const r of c.results) if (!remoteKeys.has(`${c.id}|${resultKey(r)}`)) return true;
  }
  return false;
}
