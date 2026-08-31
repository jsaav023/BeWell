import type { AppState } from "./types";
import { DEFAULT_SETTINGS } from "./cycle";

const LEGACY_KEY = "bewell-cycle-data-v1";

function userCacheKey(userId: string): string {
  return `bewell-cycle-cache-v2:${userId}`;
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

function readLocalCache(userId: string): AppState | null {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(userCacheKey(userId));
  if (cached) return parseState(cached);

  const legacyScoped = localStorage.getItem(`bewell-cycle-data-v1:${userId}`);
  if (legacyScoped) return parseState(legacyScoped);

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) return parseState(legacy);

  return null;
}

function writeLocalCache(userId: string, state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(userCacheKey(userId), JSON.stringify(state));
}

const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

export async function loadState(userId: string | null): Promise<AppState> {
  if (!userId) return emptyState();

  try {
    const response = await fetch("/api/cycle-data", {
      credentials: "include",
    });

    if (response.ok) {
      const body = (await response.json()) as { data: AppState };
      const state = {
        cycles: body.data.cycles ?? [],
        days: body.data.days ?? {},
        settings: { ...DEFAULT_SETTINGS, ...body.data.settings },
      };
      writeLocalCache(userId, state);
      return state;
    }
  } catch {
    // fall back to local cache when offline
  }

  return readLocalCache(userId) ?? emptyState();
}

export function saveState(userId: string | null, state: AppState): void {
  if (!userId || typeof window === "undefined") return;

  writeLocalCache(userId, state);

  const existing = pendingSaves.get(userId);
  if (existing) clearTimeout(existing);

  pendingSaves.set(
    userId,
    setTimeout(() => {
      pendingSaves.delete(userId);
      void fetch("/api/cycle-data", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: state }),
      });
    }, 400),
  );
}

export async function syncLocalStateToAccount(userId: string): Promise<void> {
  const local = readLocalCache(userId);
  if (!local) return;

  const hasLocalData =
    local.cycles.length > 0 || Object.keys(local.days).length > 0;
  if (!hasLocalData) return;

  try {
    const response = await fetch("/api/cycle-data", {
      credentials: "include",
    });
    if (!response.ok) return;

    const body = (await response.json()) as { data: AppState };
    const remoteHasData =
      body.data.cycles.length > 0 ||
      Object.keys(body.data.days).length > 0;

    if (!remoteHasData) {
      await fetch("/api/cycle-data", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: local }),
      });
    }
  } catch {
    // ignore sync errors
  }
}
