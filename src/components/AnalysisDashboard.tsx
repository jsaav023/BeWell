"use client";

import { useMemo } from "react";
import { useCycle } from "@/context/CycleContext";
import { analyzeCycles } from "@/lib/analytics";
import { formatDisplayDate } from "@/lib/cycle";

function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/90 px-4 py-4 bee-card">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        {value}
        {unit && (
          <span className="ml-1 text-base font-normal text-[var(--muted)]">
            {unit}
          </span>
        )}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export function AnalysisDashboard() {
  const { state } = useCycle();
  const analysis = useMemo(() => analyzeCycles(state), [state]);

  if (!analysis.hasData) {
    return (
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/85 px-6 py-12 text-center bee-card">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          No data yet
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {analysis.insights[0]}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Averages
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Cycle length"
            value={analysis.avgCycleLength ?? "—"}
            unit={analysis.avgCycleLength ? "days" : undefined}
            hint={
              analysis.cyclesLogged < 2
                ? "Needs 2+ cycles"
                : undefined
            }
          />
          <StatCard
            label="Period length"
            value={analysis.avgPeriodLength ?? "—"}
            unit={analysis.avgPeriodLength ? "days" : undefined}
          />
          <StatCard
            label="Cycles logged"
            value={analysis.cyclesLogged}
          />
          <StatCard
            label="Period days"
            value={analysis.periodDaysLogged}
          />
        </div>
      </section>

      {(analysis.shortestCycle !== null || analysis.longestCycle !== null) && (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/85 px-4 py-4 bee-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Cycle range
          </h2>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--muted)]">Shortest</p>
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {analysis.shortestCycle ?? "—"}
                <span className="text-sm text-[var(--muted)]"> d</span>
              </p>
            </div>
            <div className="h-8 flex-1 rounded-full bg-[var(--wash)]">
              <div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--pink-soft), var(--accent), var(--honey-soft))",
                  width:
                    analysis.shortestCycle && analysis.longestCycle
                      ? `${Math.min(100, ((analysis.avgCycleLength ?? 28) / 45) * 100)}%`
                      : "50%",
                }}
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--muted)]">Longest</p>
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {analysis.longestCycle ?? "—"}
                <span className="text-sm text-[var(--muted)]"> d</span>
              </p>
            </div>
          </div>
          {analysis.cycleVariation !== null && (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Typical variation: ±{analysis.cycleVariation} days
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/85 px-4 py-4 bee-card">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Period flow
        </h2>
        {analysis.flowBreakdown.every((f) => f.count === 0) ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Set flow on period days when you update tracking to see your
            pattern.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {analysis.flowBreakdown.map((flow) => (
              <div key={flow.level}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--ink)]">
                    {flow.label}
                  </span>
                  <span className="text-[var(--muted)]">
                    {flow.percent}% · {flow.count} day
                    {flow.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--wash)]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(flow.percent, flow.count ? 4 : 0)}%`,
                      backgroundColor: flow.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {analysis.recentCycles.length > 0 && (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/85 px-4 py-4 bee-card">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Recent cycles
          </h2>
          <ul className="mt-3 space-y-2">
            {analysis.recentCycles.map((cycle) => (
              <li
                key={cycle.startDate}
                className="flex items-center justify-between rounded-xl bg-[var(--wash)] px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-[var(--ink)]">
                  {formatDisplayDate(cycle.startDate)}
                </span>
                <span className="text-[var(--muted)]">
                  {cycle.periodLength}d period
                  {cycle.cycleLength ? ` · ${cycle.cycleLength}d cycle` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/85 px-4 py-4 bee-card">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Insights
        </h2>
        <ul className="mt-3 space-y-3">
          {analysis.insights.map((insight) => (
            <li
              key={insight}
              className="flex gap-3 text-sm leading-relaxed text-[var(--ink)]"
            >
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--honey)]"
                aria-hidden
              />
              {insight}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
