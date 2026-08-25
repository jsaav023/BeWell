"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCycleDay,
  getCycleLength,
  getLatestCycle,
  getPeriodLength,
  getPhaseForDay,
  sortCycles,
  toDateKey,
  uid,
} from "@/lib/cycle";
import { emptyState, loadState, saveState } from "@/lib/storage";
import type {
  AppState,
  Cycle,
  CycleSettings,
  DayLog,
  FlowLevel,
  PhaseInfo,
} from "@/lib/types";

type CycleContextValue = {
  ready: boolean;
  state: AppState;
  todayKey: string;
  latestCycle: Cycle | null;
  cycleDay: number | null;
  phase: PhaseInfo | null;
  cycleLength: number;
  periodLength: number;
  logPeriodStart: (dateKey?: string) => void;
  endPeriod: (dateKey?: string) => void;
  togglePeriodDay: (dateKey: string) => void;
  setDayFlow: (dateKey: string, flow: FlowLevel | undefined) => void;
  setDayNote: (dateKey: string, note: string) => void;
  updateSettings: (settings: Partial<CycleSettings>) => void;
  deleteCycle: (id: string) => void;
};

const CycleContext = createContext<CycleContextValue | null>(null);

function rebuildCyclesFromDays(days: Record<string, DayLog>): Cycle[] {
  const periodDates = Object.values(days)
    .filter((d) => d.isPeriod)
    .map((d) => d.date)
    .sort();

  if (periodDates.length === 0) return [];

  const cycles: Cycle[] = [];
  let runStart = periodDates[0];
  let runEnd = periodDates[0];

  for (let i = 1; i < periodDates.length; i++) {
    const prev = new Date(runEnd + "T12:00:00");
    const curr = new Date(periodDates[i] + "T12:00:00");
    const gap = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (gap === 1) {
      runEnd = periodDates[i];
    } else if (gap <= 2) {
      // allow 1-day gap in bleeding
      runEnd = periodDates[i];
    } else {
      cycles.push({
        id: uid(),
        startDate: runStart,
        endDate: runEnd,
        periodLength:
          Math.round(
            (new Date(runEnd + "T12:00:00").getTime() -
              new Date(runStart + "T12:00:00").getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1,
      });
      runStart = periodDates[i];
      runEnd = periodDates[i];
    }
  }

  cycles.push({
    id: uid(),
    startDate: runStart,
    endDate: runEnd,
    periodLength:
      Math.round(
        (new Date(runEnd + "T12:00:00").getTime() -
          new Date(runStart + "T12:00:00").getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1,
  });

  return sortCycles(cycles);
}

export function CycleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(emptyState);
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [state, ready]);

  const latestCycle = useMemo(
    () => getLatestCycle(state.cycles),
    [state.cycles],
  );

  const cycleLength = useMemo(() => {
    if (!latestCycle) return state.settings.averageCycleLength;
    return getCycleLength(latestCycle, state.cycles, state.settings);
  }, [latestCycle, state.cycles, state.settings]);

  const periodLength = useMemo(() => {
    if (!latestCycle) return state.settings.averagePeriodLength;
    return getPeriodLength(latestCycle, state.settings);
  }, [latestCycle, state.settings]);

  const cycleDay = useMemo(
    () => getCycleDay(todayKey, state.cycles, state.settings),
    [todayKey, state.cycles, state.settings],
  );

  const phase = useMemo(() => {
    if (!cycleDay) return null;
    return getPhaseForDay(cycleDay, periodLength, cycleLength);
  }, [cycleDay, periodLength, cycleLength]);

  const logPeriodStart = useCallback(
    (dateKey = todayKey) => {
      setState((prev) => {
        const days = { ...prev.days };
        const existing = days[dateKey];
        days[dateKey] = {
          date: dateKey,
          isPeriod: true,
          flow: existing?.flow ?? "medium",
          note: existing?.note,
        };
        // Mark following average period days if empty
        const start = new Date(dateKey + "T12:00:00");
        for (let i = 1; i < prev.settings.averagePeriodLength; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const key = toDateKey(d);
          if (!days[key]?.isPeriod) {
            days[key] = {
              date: key,
              isPeriod: true,
              flow: "medium",
            };
          }
        }
        return {
          ...prev,
          days,
          cycles: rebuildCyclesFromDays(days),
        };
      });
    },
    [todayKey],
  );

  const endPeriod = useCallback(
    (dateKey = todayKey) => {
      setState((prev) => {
        const days = { ...prev.days };
        // Remove period marks after dateKey for current run
        const keys = Object.keys(days)
          .filter((k) => days[k].isPeriod && k > dateKey)
          .sort();
        for (const k of keys) {
          // only clear contiguous future period days
          const prevKey = keys[keys.indexOf(k) - 1] ?? dateKey;
          const gap =
            (new Date(k + "T12:00:00").getTime() -
              new Date(prevKey + "T12:00:00").getTime()) /
            (1000 * 60 * 60 * 24);
          if (gap > 2) break;
          const { flow: _f, note, ...rest } = days[k];
          void _f;
          void rest;
          if (note) {
            days[k] = { date: k, isPeriod: false, note };
          } else {
            delete days[k];
          }
        }
        if (!days[dateKey]) {
          days[dateKey] = { date: dateKey, isPeriod: true, flow: "light" };
        } else {
          days[dateKey] = { ...days[dateKey], isPeriod: true };
        }
        return {
          ...prev,
          days,
          cycles: rebuildCyclesFromDays(days),
        };
      });
    },
    [todayKey],
  );

  const togglePeriodDay = useCallback(
    (dateKey: string) => {
      setState((prev) => {
        const days = { ...prev.days };
        const existing = days[dateKey];
        if (existing?.isPeriod) {
          if (existing.note || existing.flow) {
            days[dateKey] = {
              date: dateKey,
              isPeriod: false,
              note: existing.note,
            };
          } else {
            delete days[dateKey];
          }
        } else {
          days[dateKey] = {
            date: dateKey,
            isPeriod: true,
            flow: existing?.flow ?? "medium",
            note: existing?.note,
          };
        }
        return {
          ...prev,
          days,
          cycles: rebuildCyclesFromDays(days),
        };
      });
    },
    [],
  );

  const setDayFlow = useCallback((dateKey: string, flow: FlowLevel | undefined) => {
    setState((prev) => {
      const days = { ...prev.days };
      const existing = days[dateKey] ?? {
        date: dateKey,
        isPeriod: true,
      };
      days[dateKey] = {
        ...existing,
        isPeriod: true,
        flow,
      };
      return {
        ...prev,
        days,
        cycles: rebuildCyclesFromDays(days),
      };
    });
  }, []);

  const setDayNote = useCallback((dateKey: string, note: string) => {
    setState((prev) => {
      const days = { ...prev.days };
      const existing = days[dateKey] ?? { date: dateKey, isPeriod: false };
      days[dateKey] = { ...existing, note: note || undefined };
      if (!days[dateKey].isPeriod && !days[dateKey].note && !days[dateKey].flow) {
        delete days[dateKey];
      }
      return { ...prev, days };
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<CycleSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const deleteCycle = useCallback((id: string) => {
    setState((prev) => {
      const cycle = prev.cycles.find((c) => c.id === id);
      if (!cycle) return prev;
      const days = { ...prev.days };
      const start = cycle.startDate;
      const end = cycle.endDate ?? cycle.startDate;
      for (const key of Object.keys(days)) {
        if (key >= start && key <= end && days[key].isPeriod) {
          if (days[key].note) {
            days[key] = { ...days[key], isPeriod: false, flow: undefined };
          } else {
            delete days[key];
          }
        }
      }
      return {
        ...prev,
        days,
        cycles: rebuildCyclesFromDays(days),
      };
    });
  }, []);

  const value: CycleContextValue = {
    ready,
    state,
    todayKey,
    latestCycle,
    cycleDay,
    phase,
    cycleLength,
    periodLength,
    logPeriodStart,
    endPeriod,
    togglePeriodDay,
    setDayFlow,
    setDayNote,
    updateSettings,
    deleteCycle,
  };

  return (
    <CycleContext.Provider value={value}>{children}</CycleContext.Provider>
  );
}

export function useCycle() {
  const ctx = useContext(CycleContext);
  if (!ctx) throw new Error("useCycle must be used within CycleProvider");
  return ctx;
}
