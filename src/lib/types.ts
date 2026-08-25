export type FlowLevel = "spotting" | "light" | "medium" | "heavy";

export type DayLog = {
  date: string; // YYYY-MM-DD
  isPeriod: boolean;
  flow?: FlowLevel;
  note?: string;
};

export type Cycle = {
  id: string;
  startDate: string; // YYYY-MM-DD first day of period
  endDate?: string; // last day of period bleeding
  periodLength?: number;
};

export type CycleSettings = {
  averageCycleLength: number;
  averagePeriodLength: number;
};

export type PhaseId = "menstrual" | "follicular" | "ovulation" | "luteal";

export type PhaseInfo = {
  id: PhaseId;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  soft: string;
};

export type AppState = {
  cycles: Cycle[];
  days: Record<string, DayLog>;
  settings: CycleSettings;
};
