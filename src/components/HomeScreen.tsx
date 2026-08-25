"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CycleRing } from "@/components/CycleRing";
import { TrackModal } from "@/components/TrackModal";
import { useCycle } from "@/context/CycleContext";
import { formatDisplayDate } from "@/lib/cycle";

export function HomeScreen() {
  const {
    ready,
    phase,
    cycleDay,
    cycleLength,
    latestCycle,
    state,
    updateSettings,
  } = useCycle();
  const [open, setOpen] = useState(false);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-28 pt-10">
        <header className="mb-8 text-center">
          <h1 className="brand-title font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--ink)] sm:text-6xl">
            BeWell
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {phase
              ? phase.description
              : "Log your period to see your cycle phase."}
          </p>
        </header>

        <CycleRing
          cycleDay={cycleDay}
          cycleLength={cycleLength}
          phase={phase}
          onTrack={() => setOpen(true)}
        />

        <section className="mt-10 space-y-4 text-center">
          {latestCycle ? (
            <p className="text-sm text-[var(--muted)]">
              Current cycle started{" "}
              <span className="font-medium text-[var(--ink)]">
                {formatDisplayDate(latestCycle.startDate)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Tap the center to log your first period day.
            </p>
          )}

          <div className="mx-auto flex max-w-xs items-center justify-center gap-3 rounded-full bg-[var(--surface)]/70 px-4 py-2 text-xs text-[var(--muted)]">
            <label className="flex items-center gap-2">
              Cycle
              <input
                type="number"
                min={21}
                max={45}
                value={state.settings.averageCycleLength}
                onChange={(e) =>
                  updateSettings({
                    averageCycleLength: Number(e.target.value) || 28,
                  })
                }
                className="w-12 rounded-lg border-0 bg-[var(--wash)] px-2 py-1 text-center text-[var(--ink)] outline-none"
              />
              d
            </label>
            <span aria-hidden>·</span>
            <label className="flex items-center gap-2">
              Period
              <input
                type="number"
                min={2}
                max={10}
                value={state.settings.averagePeriodLength}
                onChange={(e) =>
                  updateSettings({
                    averagePeriodLength: Number(e.target.value) || 5,
                  })
                }
                className="w-12 rounded-lg border-0 bg-[var(--wash)] px-2 py-1 text-center text-[var(--ink)] outline-none"
              />
              d
            </label>
          </div>
        </section>
      </main>

      <TrackModal open={open} onClose={() => setOpen(false)} />
      <BottomNav />
    </>
  );
}
