"use client";

import { useMemo, useState } from "react";
import { useCycle } from "@/context/CycleContext";
import {
  getPhaseOnDate,
  getPredictedPeriodDates,
  monthLabel,
  toDateKey,
} from "@/lib/cycle";
import { TrackModal } from "./TrackModal";

export function CalendarMonth() {
  const { state, todayKey, togglePeriodDay } = useCycle();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const predicted = useMemo(
    () => getPredictedPeriodDates(state.cycles, state.settings),
    [state.cycles, state.settings],
  );

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items: ({ type: "empty" } | { type: "day"; key: string; day: number })[] =
      [];
    for (let i = 0; i < startPad; i++) items.push({ type: "empty" });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateKey(new Date(year, month, d));
      items.push({ type: "day", key, day: d });
    }
    return items;
  }, [year, month]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-full px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          {monthLabel(year, month)}
        </h2>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-full px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-medium uppercase tracking-wider text-[var(--muted)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (cell.type === "empty") {
            return <div key={`e-${i}`} className="aspect-square" />;
          }
          const log = state.days[cell.key];
          const phase = getPhaseOnDate(cell.key, state.cycles, state.settings);
          const isToday = cell.key === todayKey;
          const isPeriod = Boolean(log?.isPeriod);
          const isPredicted = !isPeriod && predicted.has(cell.key);

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelected(cell.key)}
              onDoubleClick={() => togglePeriodDay(cell.key)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition-transform active:scale-95 ${
                isPeriod
                  ? "text-white"
                  : isToday
                    ? "text-[var(--ink)]"
                    : "text-[var(--ink)]"
              }`}
              style={{
                background: isPeriod
                  ? "var(--accent)"
                  : isPredicted
                    ? "var(--pink-soft)"
                    : phase
                      ? phase.soft
                      : "var(--wash)",
                boxShadow: isToday
                  ? "inset 0 0 0 2px var(--ink)"
                  : undefined,
              }}
              aria-label={`${cell.key}${isPeriod ? ", period" : ""}`}
            >
              <span className="font-medium">{cell.day}</span>
              {log?.flow && (
                <span className="mt-0.5 h-1 w-1 rounded-full bg-current opacity-70" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[var(--accent)]" /> Period
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[var(--pink-soft)]" />{" "}
          Predicted
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[4px] shadow-[inset_0_0_0_2px_var(--ink)]" />{" "}
          Today
        </span>
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        Tap a day to update. Double-tap to quickly toggle period.
      </p>

      <TrackModal
        open={Boolean(selected)}
        dateKey={selected ?? undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
