"use client";

import { useEffect, useId, useState } from "react";
import { PHASES } from "@/lib/cycle";
import type { PhaseInfo } from "@/lib/types";

type Props = {
  cycleDay: number | null;
  cycleLength: number;
  phase: PhaseInfo | null;
  onTrack: () => void;
};

export function CycleRing({ cycleDay, cycleLength, phase, onTrack }: Props) {
  const [mounted, setMounted] = useState(false);
  const gradId = useId().replace(/:/g, "");

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const size = 300;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = cycleDay
    ? Math.min(cycleDay / cycleLength, 1)
    : 0;
  const dashOffset = circumference * (1 - (mounted ? progress : 0));
  const activePhase = phase ?? PHASES.follicular;

  return (
    <div className="cycle-ring relative mx-auto flex h-[300px] w-[300px] items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PHASES.menstrual.color} />
            <stop offset="35%" stopColor={PHASES.follicular.color} />
            <stop offset="55%" stopColor={PHASES.ovulation.color} />
            <stop offset="100%" stopColor={PHASES.luteal.color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--pink-soft)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>

      {/* Phase ticks */}
      <div className="pointer-events-none absolute inset-0">
        {(
          [
            { phase: PHASES.menstrual, at: 0.02 },
            { phase: PHASES.follicular, at: 0.28 },
            { phase: PHASES.ovulation, at: 0.5 },
            { phase: PHASES.luteal, at: 0.72 },
          ] as const
        ).map(({ phase: p, at }) => {
          const angle = at * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const r = radius - 28;
          const x = size / 2 + Math.cos(rad) * r;
          const y = size / 2 + Math.sin(rad) * r;
          return (
            <span
              key={p.id}
              className="absolute text-[0.62rem] font-medium tracking-wide text-[var(--muted)]"
              style={{
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
                color:
                  activePhase.id === p.id ? p.color : "var(--muted)",
              }}
            >
              {p.shortLabel}
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onTrack}
        className="track-btn relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-full text-center shadow-[0_12px_40px_rgba(255,93,162,0.22)] transition-transform active:scale-[0.97]"
        style={{
          background: `radial-gradient(circle at 30% 25%, #fff 0%, ${activePhase.soft} 45%, ${activePhase.color}22 100%)`,
          border: `1.5px solid ${activePhase.color}55`,
        }}
      >
        <span className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-[var(--ink)]">
          {cycleDay ? `Day ${cycleDay}` : "Start"}
        </span>
        <span
          className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: activePhase.color }}
        >
          {cycleDay ? activePhase.label : "Track"}
        </span>
        <span className="mt-3 text-[0.7rem] text-[var(--muted)]">
          Tap to update
        </span>
      </button>
    </div>
  );
}
