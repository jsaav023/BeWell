import type { AppState } from "./types";
import { DEFAULT_SETTINGS } from "./cycle";

const STORAGE_KEY = "bewell-cycle-data-v1";

export const emptyState = (): AppState => ({
  cycles: [],
  days: {},
  settings: { ...DEFAULT_SETTINGS },
});

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
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

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
