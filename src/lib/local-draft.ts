// Local draft cache — since there's no backend auth/session right now,
// this is a lightweight safety net so typed input on slow/flaky connections
// never just vanishes. Drafts persist in localStorage and are cleared once
// the save actually succeeds.

const PREFIX = "bf_draft_";

export function saveDraft<T>(key: string, data: T) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently, it's just a convenience cache
  }
}

export function loadDraft<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
