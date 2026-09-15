"use client";

/**
 * Device links: a parent link (this device is one child of an account) and
 * class memberships (this device is a student in a teacher's class). Holds
 * the links in localStorage, reports finished sessions to each target, and
 * drops a link the moment the account or teacher revokes it. Inert without
 * a Convex URL.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { SessionResult } from "@/lib/lesson-engine/types";
import { useAppStore } from "@/lib/store/app-store";
import { resultKey, type RemoteResult } from "@/lib/store/merge";
import { EMPTY_LINKS, loadLinks, loadPushed, saveLinks, savePushed, type ClassLink, type DeviceLinks, type ParentLink } from "@/lib/store/links";
import { DEFAULT_SETTINGS, type AppState, type AvatarColor, type ChildProfile, type ChildSettings } from "@/lib/store/state";
import { convexEnabled } from "./config";

export interface ClassStatus {
  classroomName: string;
  teacherName: string;
  grade: number;
  studentName: string;
  assignments: { lessonId: string; note: string; createdAt: number }[];
}

export interface RedeemedChild {
  token: string;
  child: { clientId: string; name: string; age: number; grade: number; color: string; settings: unknown; createdAt: number; updatedAt?: number };
  results: RemoteResult[];
}

export interface RedeemedClass {
  token: string;
  classroomId: string;
  studentId: string;
  classroomName: string;
  teacherName: string;
  grade: number;
  studentName: string;
}

export interface LinksApi {
  enabled: boolean;
  loaded: boolean;
  links: DeviceLinks;
  /** Live class info per classroomId (assignments included). */
  classStatus: Record<string, ClassStatus>;
  attachChild: (r: RedeemedChild) => void;
  joinClass: (r: RedeemedClass, clientChildId: string) => void;
  detachParent: () => void;
  leaveClass: (classroomId: string) => void;
}

const noop: LinksApi = { enabled: false, loaded: true, links: EMPTY_LINKS, classStatus: {}, attachChild: () => {}, joinClass: () => {}, detachParent: () => {}, leaveClass: () => {} };
const Ctx = createContext<LinksApi>(noop);

const COLORS: AvatarColor[] = ["yellow", "blue", "green", "cream"];

function toProfile(c: RedeemedChild["child"], results: RemoteResult[], existing?: ChildProfile): ChildProfile {
  const settings: ChildSettings = { ...DEFAULT_SETTINGS, ...((c.settings as Partial<ChildSettings>) ?? {}) };
  const color = COLORS.includes(c.color as AvatarColor) ? (c.color as AvatarColor) : "yellow";
  const own: SessionResult[] = results.map(({ childClientId: _c, ...r }) => {
    void _c;
    return { ...r, childName: c.name };
  });
  const seen = new Set(own.map(resultKey));
  const merged = [...own, ...(existing?.results ?? []).filter((r) => !seen.has(resultKey(r)))].sort((a, b) => (a.endedAt ?? 0) - (b.endedAt ?? 0));
  return { id: c.clientId, name: c.name, age: c.age, grade: c.grade, color, settings, results: merged, createdAt: c.createdAt, updatedAt: c.updatedAt ?? c.createdAt };
}

function stripResult(r: SessionResult, childClientId: string): RemoteResult {
  const { childName: _n, ...rest } = r;
  void _n;
  return { ...rest, childClientId };
}

export function LinksProvider({ children }: { children: ReactNode }) {
  if (!convexEnabled()) return <Ctx.Provider value={noop}>{children}</Ctx.Provider>;
  return <LinksInner>{children}</LinksInner>;
}

function LinksInner({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const { state, hydrated, importState } = useAppStore();
  const [links, setLinks] = useState<DeviceLinks>(EMPTY_LINKS);
  const [loaded, setLoaded] = useState(false);
  const [classStatus, setClassStatus] = useState<Record<string, ClassStatus>>({});
  const pushed = useRef<Record<string, string[]>>({});
  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  useEffect(() => {
    setLinks(loadLinks());
    pushed.current = loadPushed();
    setLoaded(true);
  }, []);

  const update = useCallback((next: DeviceLinks) => {
    setLinks(next);
    saveLinks(next);
  }, []);

  const markPushed = (target: string, keys: string[]) => {
    const cur = new Set(pushed.current[target] ?? []);
    keys.forEach((k) => cur.add(k));
    pushed.current = { ...pushed.current, [target]: [...cur].slice(-200) };
    savePushed(pushed.current);
  };

  /* ---- attach / join / detach ---- */

  const attachChild = useCallback(
    (r: RedeemedChild) => {
      const s = stateRef.current;
      const existing = s.children.find((c) => c.id === r.child.clientId);
      const profile = toProfile(r.child, r.results, existing);
      const others = s.children.filter((c) => c.id !== profile.id);
      // A fresh device carries only the untouched demo child; the linked child replaces it.
      const pristine = others.length === 1 && !s.onboarded && others[0].results.length === 0 && !others[0].updatedAt;
      importState({ ...s, children: pristine ? [profile] : [...others, profile], activeChildId: profile.id, onboarded: true });
      markPushed("parent", r.results.map(resultKey));
      const parent: ParentLink = { token: r.token, childClientId: r.child.clientId, childName: r.child.name, since: Date.now() };
      update({ ...loadLinks(), parent });
    },
    [importState, update],
  );

  const joinClass = useCallback(
    (r: RedeemedClass, clientChildId: string) => {
      const cur = loadLinks();
      const link: ClassLink = { token: r.token, classroomId: r.classroomId, studentId: r.studentId, classroomName: r.classroomName, teacherName: r.teacherName, studentName: r.studentName, clientChildId, since: Date.now() };
      update({ ...cur, classes: [...cur.classes.filter((c) => c.classroomId !== r.classroomId), link] });
    },
    [update],
  );

  const detachParent = useCallback(() => update({ ...loadLinks(), parent: undefined }), [update]);
  const leaveClass = useCallback((classroomId: string) => {
    const cur = loadLinks();
    update({ ...cur, classes: cur.classes.filter((c) => c.classroomId !== classroomId) });
    setClassStatus((m) => {
      const { [classroomId]: _gone, ...rest } = m;
      void _gone;
      return rest;
    });
  }, [update]);

  /* ---- report sessions (debounced) ---- */

  useEffect(() => {
    if (!hydrated || !loaded) return;
    const t = setTimeout(async () => {
      const p = links.parent;
      if (p) {
        const child = state.children.find((c) => c.id === p.childClientId);
        if (child) {
          const done = new Set(pushed.current.parent ?? []);
          const fresh = child.results.filter((r) => !done.has(resultKey(r)));
          const lastSettings = pushed.current["parent:settings"]?.[0];
          const settingsKey = JSON.stringify(child.settings);
          if (fresh.length || lastSettings !== settingsKey) {
            try {
              await convex.mutation(api.links.childSync, { deviceToken: p.token, settings: child.settings, results: fresh.map((r) => stripResult(r, child.id)) });
              markPushed("parent", fresh.map(resultKey));
              pushed.current = { ...pushed.current, "parent:settings": [settingsKey] };
              savePushed(pushed.current);
            } catch (e) {
              if (String((e as Error).message).includes("revoked")) detachParent();
            }
          }
        }
      }
      for (const cl of links.classes) {
        const child = state.children.find((c) => c.id === cl.clientChildId);
        if (!child) continue;
        const done = new Set(pushed.current[cl.classroomId] ?? []);
        const fresh = child.results.filter((r) => !done.has(resultKey(r)));
        if (!fresh.length) continue;
        try {
          await convex.mutation(api.classroom.studentSync, {
            deviceToken: cl.token,
            results: fresh.map((r) => ({ lessonId: r.lessonId, startedAt: r.startedAt, endedAt: r.endedAt, questions: r.questions, correct: r.correct, reexplain: r.reexplain, startDifficulty: r.startDifficulty, endDifficulty: r.endDifficulty, rating: r.rating, concepts: r.concepts })),
          });
          markPushed(cl.classroomId, fresh.map(resultKey));
        } catch (e) {
          if (String((e as Error).message).includes("revoked")) leaveClass(cl.classroomId);
        }
      }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, links, hydrated, loaded]);

  /* ---- follow the account's copy of the linked child ---- */

  const remoteChild = useQuery(api.links.childStatus, links.parent ? { deviceToken: links.parent.token } : "skip");
  useEffect(() => {
    if (!links.parent || remoteChild === undefined) return;
    if (remoteChild === null) {
      detachParent();
      return;
    }
    const s = stateRef.current;
    const local = s.children.find((c) => c.id === remoteChild.clientId);
    if (!local) return;
    const remoteUpdated = remoteChild.updatedAt ?? remoteChild.createdAt;
    if (remoteUpdated > (local.updatedAt ?? local.createdAt)) {
      const settings: ChildSettings = { ...DEFAULT_SETTINGS, ...((remoteChild.settings as Partial<ChildSettings>) ?? {}) };
      const color = COLORS.includes(remoteChild.color as AvatarColor) ? (remoteChild.color as AvatarColor) : local.color;
      importState({ ...s, children: s.children.map((c) => (c.id === local.id ? { ...c, name: remoteChild.name, age: remoteChild.age, grade: remoteChild.grade, color, settings, updatedAt: remoteUpdated } : c)) });
      pushed.current = { ...pushed.current, "parent:settings": [JSON.stringify(settings)] };
      savePushed(pushed.current);
    }
  }, [remoteChild, links.parent, importState, detachParent]);

  const value = useMemo<LinksApi>(
    () => ({ enabled: true, loaded, links, classStatus, attachChild, joinClass, detachParent, leaveClass }),
    [loaded, links, classStatus, attachChild, joinClass, detachParent, leaveClass],
  );

  return (
    <Ctx.Provider value={value}>
      {links.classes.map((cl) => (
        <ClassWatcher key={cl.classroomId} link={cl} onStatus={(st) => setClassStatus((m) => (st ? { ...m, [cl.classroomId]: st } : m))} onGone={() => leaveClass(cl.classroomId)} />
      ))}
      {children}
    </Ctx.Provider>
  );
}

/** One subscription per class membership; null from the server means the teacher removed this student. */
function ClassWatcher({ link, onStatus, onGone }: { link: ClassLink; onStatus: (s: ClassStatus | null) => void; onGone: () => void }) {
  const st = useQuery(api.classroom.studentStatus, { deviceToken: link.token });
  useEffect(() => {
    if (st === undefined) return;
    if (st === null) onGone();
    else onStatus(st);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);
  return null;
}

export function useLinks(): LinksApi {
  return useContext(Ctx);
}
