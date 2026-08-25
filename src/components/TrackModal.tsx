"use client";

import { useEffect, useRef } from "react";
import { useCycle } from "@/context/CycleContext";
import { formatDisplayDate } from "@/lib/cycle";
import type { FlowLevel } from "@/lib/types";

const FLOWS: FlowLevel[] = ["spotting", "light", "medium", "heavy"];

type Props = {
  open: boolean;
  onClose: () => void;
  dateKey?: string;
};

export function TrackModal({ open, onClose, dateKey }: Props) {
  const {
    todayKey,
    logPeriodStart,
    endPeriod,
    togglePeriodDay,
    setDayFlow,
    state,
    latestCycle,
  } = useCycle();
  const key = dateKey ?? todayKey;
  const day = state.days[key];
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isPeriod = Boolean(day?.isPeriod);
  const inCurrentPeriod =
    latestCycle &&
    key >= latestCycle.startDate &&
    (!latestCycle.endDate || key <= latestCycle.endDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(44,36,40,0.35)] p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby="track-title"
        className="modal-panel w-full max-w-md rounded-3xl bg-[var(--surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
          Update tracking
        </p>
        <h2
          id="track-title"
          className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]"
        >
          {formatDisplayDate(key)}
        </h2>

        <div className="mt-6 flex flex-col gap-3">
          {!latestCycle || key < (latestCycle?.startDate ?? "") ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                logPeriodStart(key);
                onClose();
              }}
            >
              Log period start
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  togglePeriodDay(key);
                }}
              >
                {isPeriod ? "Unmark as period day" : "Mark as period day"}
              </button>
              {inCurrentPeriod && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    endPeriod(key);
                    onClose();
                  }}
                >
                  End period on this day
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  logPeriodStart(key);
                  onClose();
                }}
              >
                Start a new cycle here
              </button>
            </>
          )}
        </div>

        {(isPeriod || day?.isPeriod) && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-[var(--ink)]">Flow</p>
            <div className="flex flex-wrap gap-2">
              {FLOWS.map((flow) => (
                <button
                  key={flow}
                  type="button"
                  onClick={() => setDayFlow(key, flow)}
                  className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
                    day?.flow === flow
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--wash)] text-[var(--ink)] hover:bg-[var(--wash-strong)]"
                  }`}
                >
                  {flow}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className="mt-6 w-full text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
