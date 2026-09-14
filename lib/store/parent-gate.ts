/** Session-scoped flag set after a successful parent PIN entry. */
export const PARENT_UNLOCK_KEY = "ai-teacher:parent-unlocked";

export function isParentUnlocked(): boolean {
  try {
    return window.sessionStorage.getItem(PARENT_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockParent() {
  try {
    window.sessionStorage.setItem(PARENT_UNLOCK_KEY, "1");
  } catch {}
}

export function lockParent() {
  try {
    window.sessionStorage.removeItem(PARENT_UNLOCK_KEY);
  } catch {}
}
