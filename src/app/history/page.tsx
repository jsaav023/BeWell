"use client";

import { BottomNav } from "@/components/BottomNav";
import { BeeBrand } from "@/components/BeeBrand";
import { HistoryYears } from "@/components/HistoryYears";
import { useCycle } from "@/context/CycleContext";

export default function HistoryPage() {
  const { ready } = useCycle();

  return (
    <>
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-10">
        <header className="mb-8">
          <BeeBrand size="sm" />
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            History
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Past cycles, collapsed by year.
          </p>
        </header>

        {ready ? (
          <HistoryYears />
        ) : (
          <p className="text-[var(--muted)]">Loading…</p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
