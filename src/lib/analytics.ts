import {
  daysBetween,
  getPeriodLength,
  sortCycles,
  toDateKey,
  addDays,
  parseDateKey,
} from "./cycle";
import type { AppState, FlowLevel } from "./types";

export type FlowBreakdown = {
  level: FlowLevel;
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type CycleSnapshot = {
  startDate: string;
  cycleLength: number | null;
  periodLength: number;
};

export type CycleAnalysis = {
  hasData: boolean;
  cyclesLogged: number;
  periodDaysLogged: number;
  avgCycleLength: number | null;
  avgPeriodLength: number | null;
  shortestCycle: number | null;
  longestCycle: number | null;
  cycleVariation: number | null;
  flowBreakdown: FlowBreakdown[];
  dominantFlow: FlowLevel | null;
  heaviestFlowDay: number | null;
  recentCycles: CycleSnapshot[];
  insights: string[];
};

const FLOW_META: Record<
  FlowLevel,
  { label: string; color: string; weight: number }
> = {
  spotting: { label: "Spotting", color: "#FFB8D4", weight: 1 },
  light: { label: "Light", color: "#FF8FC4", weight: 2 },
  medium: { label: "Medium", color: "#FF5DA2", weight: 3 },
  heavy: { label: "Heavy", color: "#E8458F", weight: 4 },
};

const FLOW_LEVELS: FlowLevel[] = ["spotting", "light", "medium", "heavy"];

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(
    values.reduce((sum, n) => sum + n, 0) / values.length,
  );
}

function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length;
  return Math.round(Math.sqrt(variance));
}

function getPeriodDaysInCycle(
  cycleStart: string,
  cycleEnd: string | undefined,
  nextCycleStart: string | undefined,
  settings: AppState["settings"],
  days: AppState["days"],
): string[] {
  const upperBound = nextCycleStart
    ? toDateKey(addDays(parseDateKey(nextCycleStart), -1))
    : cycleEnd ??
      toDateKey(
        addDays(
          parseDateKey(cycleStart),
          getPeriodLength(
            { id: "", startDate: cycleStart, endDate: cycleEnd },
            settings,
          ) - 1,
        ),
      );

  return Object.values(days)
    .filter(
      (d) => d.isPeriod && d.date >= cycleStart && d.date <= upperBound,
    )
    .map((d) => d.date)
    .sort();
}

export function analyzeCycles(state: AppState): CycleAnalysis {
  const sorted = sortCycles(state.cycles);
  const periodDays = Object.values(state.days).filter((d) => d.isPeriod);

  if (sorted.length === 0 && periodDays.length === 0) {
    return {
      hasData: false,
      cyclesLogged: 0,
      periodDaysLogged: 0,
      avgCycleLength: null,
      avgPeriodLength: null,
      shortestCycle: null,
      longestCycle: null,
      cycleVariation: null,
      flowBreakdown: FLOW_LEVELS.map((level) => ({
        level,
        label: FLOW_META[level].label,
        count: 0,
        percent: 0,
        color: FLOW_META[level].color,
      })),
      dominantFlow: null,
      heaviestFlowDay: null,
      recentCycles: [],
      insights: [
        "Log your first period to unlock averages, flow patterns, and insights.",
      ],
    };
  }

  const periodLengths = sorted.map((c) =>
    getPeriodLength(c, state.settings),
  );
  const cycleLengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const len = daysBetween(sorted[i + 1].startDate, sorted[i].startDate);
    if (len > 0 && len <= 60) cycleLengths.push(len);
  }

  const flowCounts: Record<FlowLevel, number> = {
    spotting: 0,
    light: 0,
    medium: 0,
    heavy: 0,
  };
  let flowTotal = 0;
  for (const day of periodDays) {
    if (day.flow) {
      flowCounts[day.flow]++;
      flowTotal++;
    }
  }

  const flowBreakdown: FlowBreakdown[] = FLOW_LEVELS.map((level) => ({
    level,
    label: FLOW_META[level].label,
    count: flowCounts[level],
    percent: flowTotal ? Math.round((flowCounts[level] / flowTotal) * 100) : 0,
    color: FLOW_META[level].color,
  }));

  const dominantFlow =
    flowTotal > 0
      ? (FLOW_LEVELS.reduce((best, level) =>
          flowCounts[level] > flowCounts[best] ? level : best,
        ) as FlowLevel)
      : null;

  const heaviestDayCounts = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) {
    const cycle = sorted[i];
    const nextCycle = sorted[i + 1];
    const dates = getPeriodDaysInCycle(
      cycle.startDate,
      cycle.endDate,
      nextCycle?.startDate,
      state.settings,
      state.days,
    );
    for (let i = 0; i < dates.length; i++) {
      const flow = state.days[dates[i]]?.flow;
      if (!flow) continue;
      const dayNum = i + 1;
      const weight = FLOW_META[flow].weight;
      const prev = heaviestDayCounts.get(dayNum) ?? 0;
      heaviestDayCounts.set(dayNum, prev + weight);
    }
  }
  let heaviestFlowDay: number | null = null;
  let maxWeight = 0;
  for (const [day, weight] of heaviestDayCounts) {
    if (weight > maxWeight) {
      maxWeight = weight;
      heaviestFlowDay = day;
    }
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? average(cycleLengths)
      : state.settings.averageCycleLength;
  const avgPeriodLength =
    periodLengths.length > 0
      ? average(periodLengths)
      : state.settings.averagePeriodLength;

  const recentCycles: CycleSnapshot[] = sorted.slice(0, 6).map((cycle, idx) => ({
    startDate: cycle.startDate,
    periodLength: getPeriodLength(cycle, state.settings),
    cycleLength:
      idx < sorted.length - 1
        ? daysBetween(sorted[idx + 1].startDate, cycle.startDate)
        : null,
  }));

  const insights = buildInsights({
    cyclesLogged: sorted.length,
    periodDaysLogged: periodDays.length,
    avgCycleLength,
    avgPeriodLength,
    shortestCycle:
      cycleLengths.length > 0 ? Math.min(...cycleLengths) : null,
    longestCycle:
      cycleLengths.length > 0 ? Math.max(...cycleLengths) : null,
    cycleVariation: stdDev(cycleLengths),
    dominantFlow,
    heaviestFlowDay,
    flowTotal,
  });

  return {
    hasData: true,
    cyclesLogged: sorted.length,
    periodDaysLogged: periodDays.length,
    avgCycleLength,
    avgPeriodLength,
    shortestCycle:
      cycleLengths.length > 0 ? Math.min(...cycleLengths) : null,
    longestCycle:
      cycleLengths.length > 0 ? Math.max(...cycleLengths) : null,
    cycleVariation: stdDev(cycleLengths),
    flowBreakdown,
    dominantFlow,
    heaviestFlowDay,
    recentCycles,
    insights,
  };
}

function buildInsights(input: {
  cyclesLogged: number;
  periodDaysLogged: number;
  avgCycleLength: number | null;
  avgPeriodLength: number | null;
  shortestCycle: number | null;
  longestCycle: number | null;
  cycleVariation: number | null;
  dominantFlow: FlowLevel | null;
  heaviestFlowDay: number | null;
  flowTotal: number;
}): string[] {
  const insights: string[] = [];

  if (input.avgCycleLength) {
    if (input.avgCycleLength >= 21 && input.avgCycleLength <= 35) {
      insights.push(
        `Your average cycle is ${input.avgCycleLength} days — within the typical range.`,
      );
    } else {
      insights.push(
        `Your average cycle is ${input.avgCycleLength} days. Track a few more cycles for sharper predictions.`,
      );
    }
  }

  if (input.avgPeriodLength) {
    insights.push(
      `Your periods usually last about ${input.avgPeriodLength} day${input.avgPeriodLength === 1 ? "" : "s"}.`,
    );
  }

  if (
    input.cycleVariation !== null &&
    input.shortestCycle !== null &&
    input.longestCycle !== null
  ) {
    if (input.cycleVariation <= 2) {
      insights.push("Your cycles look very regular — nice consistency.");
    } else if (input.cycleVariation <= 5) {
      insights.push(
        `Your cycles vary by about ${input.cycleVariation} days — fairly typical.`,
      );
    } else {
      insights.push(
        `Your cycles range from ${input.shortestCycle} to ${input.longestCycle} days. Predictions may be less precise.`,
      );
    }
  } else if (input.cyclesLogged === 1) {
    insights.push(
      "Log one more full cycle to unlock cycle-length averages and regularity insights.",
    );
  }

  if (input.dominantFlow && input.flowTotal >= 3) {
    insights.push(
      `${FLOW_META[input.dominantFlow].label} flow is most common for you.`,
    );
  } else if (input.flowTotal === 0 && input.periodDaysLogged > 0) {
    insights.push(
      "Tap period days and set flow levels to see your flow pattern here.",
    );
  }

  if (input.heaviestFlowDay) {
    insights.push(
      `Heaviest flow tends to land around day ${input.heaviestFlowDay} of your period.`,
    );
  }

  if (input.cyclesLogged >= 3) {
    insights.push(
      `Based on ${input.cyclesLogged} logged cycles, your predictions are personalized to you.`,
    );
  }

  return insights.slice(0, 5);
}

export function flowLabel(level: FlowLevel): string {
  return FLOW_META[level].label;
}
