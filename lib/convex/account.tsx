"use client";

/**
 * The parent account: email-code sign-in and local-first sync of the
 * household with Convex. Without a Convex URL the provider is inert and
 * `useAccount().enabled` is false, so every screen keeps working offline.
 *
 * Sync model: the device is the source of truth for what it did; the account
 * is the union across devices. On sign-in (and whenever the account copy
 * changes) the remote household is merged into local state; whenever local
 * state changes, the device pushes after a short debounce.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAction, useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppStore } from "@/lib/store/app-store";
import { hasLocalChanges, mergeRemote, toRemote, type RemoteHousehold } from "@/lib/store/merge";
import { convexEnabled } from "./config";

const ACCOUNT_KEY = "ai-teacher:account";
const PUSH_DEBOUNCE_MS = 1500;

export interface AccountSession {
  email: string;
  token: string;
  expiresAt: number;
}

export interface AccountApi {
  enabled: boolean;
  account: AccountSession | null;
  /** Server copy, once loaded. */
  remote: { email: string; digestOptIn: boolean; lastSyncAt: number | null } | null;
  busy: "sending" | "verifying" | "syncing" | null;
  lastSyncAt: number | null;
  requestCode: (email: string) => Promise<{ sent: boolean; devCode?: string; error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setDigest: (optIn: boolean) => Promise<void>;
  exportData: () => Promise<unknown>;
  deleteAccount: () => Promise<void>;
}

const noop: AccountApi = {
  enabled: false,
  account: null,
  remote: null,
  busy: null,
  lastSyncAt: null,
  requestCode: async () => ({ sent: false, error: "مزامنة الحساب غير مفعّلة على هذا النشر." }),
  verifyCode: async () => ({ ok: false, error: "مزامنة الحساب غير مفعّلة على هذا النشر." }),
  signOut: async () => {},
  setDigest: async () => {},
  exportData: async () => null,
  deleteAccount: async () => {},
};

const Ctx = createContext<AccountApi>(noop);

function loadAccount(): AccountSession | null {
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as AccountSession;
    return a && a.token && a.expiresAt > Date.now() ? a : null;
  } catch {
    return null;
  }
}

function storeAccount(a: AccountSession | null) {
  try {
    if (a) window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
    else window.localStorage.removeItem(ACCOUNT_KEY);
  } catch {}
}

/** Renders the live provider only when Convex is configured. */
export function AccountProvider({ children }: { children: ReactNode }) {
  if (!convexEnabled()) return <Ctx.Provider value={noop}>{children}</Ctx.Provider>;
  return <LiveAccountProvider>{children}</LiveAccountProvider>;
}

function LiveAccountProvider({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const { state, hydrated, importState } = useAppStore();
  const [account, setAccount] = useState<AccountSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<AccountApi["busy"]>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  /** Bumped whenever the account copy arrives, so the push effect re-evaluates without a local change. */
  const [remoteTick, setRemoteTick] = useState(0);

  useEffect(() => {
    setAccount(loadAccount());
    setLoaded(true);
  }, []);

  const requestCodeAction = useAction(api.authEmail.requestCode);
  const verifyCodeAction = useAction(api.authEmail.verifyCode);
  const syncMutation = useMutation(api.household.sync);
  const signOutMutation = useMutation(api.household.signOut);
  const setDigestMutation = useMutation(api.household.setDigest);
  const deleteMutation = useMutation(api.household.deleteAccount);

  const token = account?.token ?? "";
  const remote = useQuery(api.household.me, loaded && token ? { token } : "skip");

  // An unknown or expired token: the server says null → sign out locally.
  useEffect(() => {
    if (token && remote === null) {
      setAccount(null);
      storeAccount(null);
    }
  }, [remote, token]);

  // Merge the account copy into local state whenever it changes.
  const stateRef = useRef(state);
  stateRef.current = state;
  const remoteRef = useRef<RemoteHousehold | null>(null);
  useEffect(() => {
    if (!remote || !hydrated) return;
    const snap: RemoteHousehold = { children: remote.children, results: remote.results as RemoteHousehold["results"] };
    remoteRef.current = snap;
    setLastSyncAt(remote.lastSyncAt ?? null);
    const merged = mergeRemote(stateRef.current, snap);
    if (JSON.stringify(merged) !== JSON.stringify(stateRef.current)) importState(merged);
    setRemoteTick((t) => t + 1);
  }, [remote, hydrated, importState]);

  // Push local changes after a short debounce.
  useEffect(() => {
    if (!token || !hydrated || !remoteRef.current) return;
    if (!hasLocalChanges(state, remoteRef.current)) return;
    const t = setTimeout(async () => {
      try {
        setBusy("syncing");
        const res = await syncMutation({ token, ...toRemote(stateRef.current) });
        const snap: RemoteHousehold = { children: res.children, results: res.results as RemoteHousehold["results"] };
        remoteRef.current = snap;
        setLastSyncAt(res.lastSyncAt);
        const merged = mergeRemote(stateRef.current, snap);
        if (JSON.stringify(merged) !== JSON.stringify(stateRef.current)) importState(merged);
      } catch (err) {
        console.warn("[account] sync failed", err);
      } finally {
        setBusy(null);
      }
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, token, hydrated, remoteTick, syncMutation, importState]);

  const requestCode = useCallback<AccountApi["requestCode"]>(
    async (email) => {
      setBusy("sending");
      try {
        return await requestCodeAction({ email });
      } catch (err) {
        console.warn("[account] requestCode failed", err);
        return { sent: false, error: "تعذّر الاتصال بالخادم. حاول بعد قليل." };
      } finally {
        setBusy(null);
      }
    },
    [requestCodeAction],
  );

  const verifyCode = useCallback<AccountApi["verifyCode"]>(
    async (email, code) => {
      setBusy("verifying");
      try {
        const res = await verifyCodeAction({ email, code });
        if (res.ok && res.token && res.expiresAt) {
          const a = { email: res.email, token: res.token, expiresAt: res.expiresAt };
          setAccount(a);
          storeAccount(a);
          return { ok: true };
        }
        return { ok: false, error: res.error ?? "الرمز غير صحيح." };
      } catch (err) {
        console.warn("[account] verifyCode failed", err);
        return { ok: false, error: "تعذّر الاتصال بالخادم. حاول بعد قليل." };
      } finally {
        setBusy(null);
      }
    },
    [verifyCodeAction],
  );

  const signOut = useCallback(async () => {
    const t = token;
    setAccount(null);
    storeAccount(null);
    remoteRef.current = null;
    if (t) await signOutMutation({ token: t }).catch(() => {});
  }, [token, signOutMutation]);

  const setDigest = useCallback(
    async (optIn: boolean) => {
      if (token) await setDigestMutation({ token, optIn });
    },
    [token, setDigestMutation],
  );

  const exportData = useCallback(async () => (token ? convex.query(api.household.exportData, { token }) : null), [token, convex]);

  const deleteAccount = useCallback(async () => {
    if (!token) return;
    await deleteMutation({ token });
    setAccount(null);
    storeAccount(null);
    remoteRef.current = null;
  }, [token, deleteMutation]);

  const value = useMemo<AccountApi>(
    () => ({
      enabled: true,
      account,
      remote: remote ? { email: remote.email, digestOptIn: remote.digestOptIn, lastSyncAt: remote.lastSyncAt } : null,
      busy,
      lastSyncAt,
      requestCode,
      verifyCode,
      signOut,
      setDigest,
      exportData,
      deleteAccount,
    }),
    [account, remote, busy, lastSyncAt, requestCode, verifyCode, signOut, setDigest, exportData, deleteAccount],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount(): AccountApi {
  return useContext(Ctx);
}
