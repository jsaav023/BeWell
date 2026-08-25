import type { AppState } from "./types";
import { DEFAULT_SETTINGS } from "./cycle";

const LEGACY_KEY = "bewell-cycle-data-v1";

function userKey(userId: string): string {
  return `bewell-cycle-data-v1:${userId}`;
}

export const emptyState = (): AppState => ({
  cycles: [],
  days: {},
  settings: { ...DEFAULT_SETTINGS },
});

function parseState(raw: string | null): AppState {
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as AppState;
    return {
      cycles: parsed.cycles ?? [],
      days: parsed.days ?? {},
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return emptyState();
  }
}

export function loadState(userId: string | null): AppState {
  if (typeof window === "undefined" || !userId) return emptyState();

  const scoped = localStorage.getItem(userKey(userId));
  if (scoped) return parseState(scoped);

  // One-time migrate pre-auth data into this user's store
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    localStorage.setItem(userKey(userId), legacy);
    localStorage.removeItem(LEGACY_KEY);
    return parseState(legacy);
  }

  return emptyState();
}

export function saveState(userId: string | null, state: AppState): void {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(userKey(userId), JSON.stringify(state));
}
