"use client";

import { BottomNav } from "@/components/BottomNav";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { BeeBrand } from "@/components/BeeBrand";
import { useCycle } from "@/context/CycleContext";

export default function AnalysisPage() {
  const { ready } = useCycle();

  return (
    <>
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-10">
        <header className="mb-8">
          <BeeBrand size="sm" />
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Analysis
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Averages, flow patterns, and personalized insights from your logs.
          </p>
        </header>

        {ready ? (
          <AnalysisDashboard />
        ) : (
          <p className="text-[var(--muted)]">Loading…</p>
        )}
      </main>
      <BottomNav />
    </>
  );
}
