"use client";

import { useMemo, useState } from "react";
import { useCycle } from "@/context/CycleContext";
import {
  daysBetween,
  formatDisplayDate,
  getCycleLength,
  sortCycles,
} from "@/lib/cycle";
import type { Cycle } from "@/lib/types";

function groupByYear(cycles: Cycle[]): Record<number, Cycle[]> {
  const groups: Record<number, Cycle[]> = {};
  for (const cycle of sortCycles(cycles)) {
    const year = Number(cycle.startDate.slice(0, 4));
    if (!groups[year]) groups[year] = [];
    groups[year].push(cycle);
  }
  return groups;
}

export function HistoryYears() {
  const { state, deleteCycle } = useCycle();
  const grouped = useMemo(() => groupByYear(state.cycles), [state.cycles]);
  const years = useMemo(
    () => Object.keys(grouped).map(Number).sort((a, b) => b - a),
    [grouped],
  );
  const [openYears, setOpenYears] = useState<Record<number, boolean>>(() => {
    const current = new Date().getFullYear();
    return { [current]: true };
  });

  if (years.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/80 px-6 py-12 text-center bee-card">
        <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          No cycles yet
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Log your period from Home or Calendar and your history will appear
          here, grouped by year.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {years.map((year) => {
        const open = openYears[year] ?? false;
        const cycles = grouped[year];
        return (
          <div
            key={year}
            className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]/85 bee-card"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() =>
                setOpenYears((prev) => ({ ...prev, [year]: !open }))
              }
              aria-expanded={open}
            >
              <div>
                <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {year}
                </span>
                <span className="ml-3 text-sm text-[var(--muted)]">
                  {cycles.length} cycle{cycles.length === 1 ? "" : "s"}
                </span>
              </div>
              <span
                className={`text-[var(--muted)] transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <ul className="space-y-3 border-t border-[var(--line)] px-5 py-4">
                  {cycles.map((cycle) => {
                    const length = getCycleLength(
                      cycle,
                      state.cycles,
                      state.settings,
                    );
                    const periodDays = cycle.endDate
                      ? daysBetween(cycle.startDate, cycle.endDate) + 1
                      : cycle.periodLength ?? state.settings.averagePeriodLength;

                    return (
                      <li
                        key={cycle.id}
                        className="flex items-start justify-between gap-3 rounded-2xl bg-[var(--wash)] px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-[var(--ink)]">
                            {formatDisplayDate(cycle.startDate)}
                            {cycle.endDate
                              ? ` – ${formatDisplayDate(cycle.endDate)}`
                              : ""}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {periodDays} period day{periodDays === 1 ? "" : "s"}
                            {" · "}
                            ~{length}-day cycle
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                "Remove this cycle’s period days from your log?",
                              )
                            ) {
                              deleteCycle(cycle.id);
                            }
                          }}
                          className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                        >
                          Delete
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
