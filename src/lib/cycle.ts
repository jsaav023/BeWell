import type { Cycle, CycleSettings, PhaseId, PhaseInfo } from "./types";

export const PHASES: Record<PhaseId, PhaseInfo> = {
  menstrual: {
    id: "menstrual",
    label: "Menstrual",
    shortLabel: "Period",
    description: "Your period is here. Rest and replenish.",
    color: "#C45C72",
    soft: "rgba(196, 92, 114, 0.18)",
  },
  follicular: {
    id: "follicular",
    label: "Follicular",
    shortLabel: "Follicular",
    description: "Energy rises as your body prepares to ovulate.",
    color: "#5F9B7A",
    soft: "rgba(95, 155, 122, 0.18)",
  },
  ovulation: {
    id: "ovulation",
    label: "Ovulation",
    shortLabel: "Ovulating",
    description: "Peak fertility window — usually around mid-cycle.",
    color: "#D4896A",
    soft: "rgba(212, 137, 106, 0.2)",
  },
  luteal: {
    id: "luteal",
    label: "Luteal",
    shortLabel: "Luteal",
    description: "Winding down before your next period.",
    color: "#A86B7C",
    soft: "rgba(168, 107, 124, 0.18)",
  },
};

export const DEFAULT_SETTINGS: CycleSettings = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
};

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysBetween(a: string, b: string): number {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function sortCycles(cycles: Cycle[]): Cycle[] {
  return [...cycles].sort(
    (a, b) => parseDateKey(b.startDate).getTime() - parseDateKey(a.startDate).getTime(),
  );
}

export function getLatestCycle(cycles: Cycle[]): Cycle | null {
  const sorted = sortCycles(cycles);
  return sorted[0] ?? null;
}

export function getCycleLength(
  cycle: Cycle,
  allCycles: Cycle[],
  settings: CycleSettings,
): number {
  const sorted = sortCycles(allCycles);
  const idx = sorted.findIndex((c) => c.id === cycle.id);
  if (idx >= 0 && idx < sorted.length - 1) {
    const older = sorted[idx + 1];
    const length = daysBetween(older.startDate, cycle.startDate);
    if (length > 0) return length;
  }
  return settings.averageCycleLength;
}

export function getPeriodLength(cycle: Cycle, settings: CycleSettings): number {
  if (cycle.endDate) {
    return daysBetween(cycle.startDate, cycle.endDate) + 1;
  }
  if (cycle.periodLength) return cycle.periodLength;
  return settings.averagePeriodLength;
}

export function getCycleDay(
  todayKey: string,
  cycles: Cycle[],
  settings: CycleSettings,
): number | null {
  const latest = getLatestCycle(cycles);
  if (!latest) return null;
  const day = daysBetween(latest.startDate, todayKey) + 1;
  const length = getCycleLength(latest, cycles, settings);
  if (day < 1) return null;
  if (day > length + 7) return null; // far past expected cycle
  return day;
}

export function getPhaseForDay(
  cycleDay: number,
  periodLength: number,
  cycleLength: number,
): PhaseInfo {
  const ovulationDay = Math.max(periodLength + 2, Math.round(cycleLength / 2));
  if (cycleDay <= periodLength) return PHASES.menstrual;
  if (cycleDay < ovulationDay - 1) return PHASES.follicular;
  if (cycleDay <= ovulationDay + 1) return PHASES.ovulation;
  return PHASES.luteal;
}

export function getPredictedPeriodDates(
  cycles: Cycle[],
  settings: CycleSettings,
  monthsAhead = 2,
): Set<string> {
  const predicted = new Set<string>();
  const latest = getLatestCycle(cycles);
  if (!latest) return predicted;

  const cycleLen = settings.averageCycleLength;
  const periodLen = settings.averagePeriodLength;
  let start = parseDateKey(latest.startDate);

  for (let i = 0; i < monthsAhead + 2; i++) {
    start = addDays(start, cycleLen);
    for (let d = 0; d < periodLen; d++) {
      predicted.add(toDateKey(addDays(start, d)));
    }
  }
  return predicted;
}

export function getPhaseOnDate(
  dateKey: string,
  cycles: Cycle[],
  settings: CycleSettings,
): PhaseInfo | null {
  const latest = getLatestCycle(cycles);
  if (!latest) return null;

  // Find which cycle this date belongs to
  const sorted = sortCycles(cycles);
  let active: Cycle | null = null;
  for (const cycle of sorted) {
    if (daysBetween(cycle.startDate, dateKey) >= 0) {
      active = cycle;
      break;
    }
  }
  if (!active) {
    // Before first logged cycle — use prediction from latest going backward
    const dayFromLatest = daysBetween(latest.startDate, dateKey) + 1;
    if (dayFromLatest < 1) {
      const len = settings.averageCycleLength;
      const wrapped = ((dayFromLatest % len) + len) % len || len;
      return getPhaseForDay(
        wrapped,
        settings.averagePeriodLength,
        settings.averageCycleLength,
      );
    }
    return null;
  }

  const cycleDay = daysBetween(active.startDate, dateKey) + 1;
  const cycleLen = getCycleLength(active, cycles, settings);
  const periodLen = getPeriodLength(active, settings);
  if (cycleDay > cycleLen + 3) {
    // Past this cycle into predicted next
    const intoNext = cycleDay - cycleLen;
    return getPhaseForDay(
      intoNext,
      settings.averagePeriodLength,
      settings.averageCycleLength,
    );
  }
  return getPhaseForDay(cycleDay, periodLen, cycleLen);
}

export function formatDisplayDate(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
