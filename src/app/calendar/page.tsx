"use client";

import { BottomNav } from "@/components/BottomNav";
import { CalendarMonth } from "@/components/CalendarMonth";
import { useCycle } from "@/context/CycleContext";

export default function CalendarPage() {
  const { ready } = useCycle();

  return (
    <>
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-10">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
            BeWell
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Calendar
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            View this month’s cycle and update any day.
          </p>
        </header>

        {ready ? (
          <CalendarMonth />
        ) : (
          <p className="text-[var(--muted)]">Loading…</p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
