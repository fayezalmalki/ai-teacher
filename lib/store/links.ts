/**
 * Links this device holds (localStorage), separate from the household store:
 * a parent link that binds the device to one child of an account, and any
 * number of class memberships. Pure helpers; lib/convex/links.tsx drives them.
 */
export const LINKS_KEY = "ai-teacher:links";
export const PUSHED_KEY = "ai-teacher:links-pushed";

export interface ParentLink {
  token: string;
  childClientId: string;
  childName: string;
  since: number;
}

export interface ClassLink {
  token: string;
  classroomId: string;
  studentId: string;
  classroomName: string;
  teacherName: string;
  studentName: string;
  /** The local child whose sessions are reported to this class. */
  clientChildId: string;
  since: number;
}

export interface DeviceLinks {
  parent?: ParentLink;
  classes: ClassLink[];
}

export const EMPTY_LINKS: DeviceLinks = { classes: [] };

export function loadLinks(): DeviceLinks {
  try {
    const raw = window.localStorage.getItem(LINKS_KEY);
    if (!raw) return EMPTY_LINKS;
    const parsed = JSON.parse(raw) as Partial<DeviceLinks>;
    return { parent: parsed.parent, classes: Array.isArray(parsed.classes) ? parsed.classes : [] };
  } catch {
    return EMPTY_LINKS;
  }
}

export function saveLinks(links: DeviceLinks) {
  try {
    window.localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  } catch {}
}

/** Result keys already reported per target (target = "parent" or a classroomId). */
export function loadPushed(): Record<string, string[]> {
  try {
    return JSON.parse(window.localStorage.getItem(PUSHED_KEY) ?? "{}") as Record<string, string[]>;
  } catch {
    return {};
  }
}

export function savePushed(p: Record<string, string[]>) {
  try {
    window.localStorage.setItem(PUSHED_KEY, JSON.stringify(p));
  } catch {}
}

/** A short device label for the parent's device list, e.g. "iPhone · Safari". */
export function deviceLabel(ua: string): string {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : "جهاز";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "";
  return br ? `${os} · ${br}` : os;
}

/** Share text for WhatsApp and friends. */
export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
