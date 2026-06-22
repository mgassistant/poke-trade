// Industry-standard TCG condition grading system
// Used across all condition selectors in the app

export interface ConditionInfo {
  value: string;
  label: string;
  shortLabel: string;
  description: string;
  gradeRange: string;
  color: string;        // Tailwind text color class
  bgColor: string;      // Tailwind bg color class
  borderColor: string;  // Tailwind border color class
  multiplier: number;   // Value multiplier (NM = 1.0x baseline)
}

export const CONDITIONS: ConditionInfo[] = [
  {
    value: "gem_mint",
    label: "Gem Mint",
    shortLabel: "GM",
    description: "Perfect. Factory fresh. No imperfections under magnification.",
    gradeRange: "PSA 10",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    multiplier: 2.0,
  },
  {
    value: "mint",
    label: "Mint",
    shortLabel: "M",
    description: "Near perfect. Virtually flawless to the naked eye.",
    gradeRange: "PSA 9–9.5",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    multiplier: 1.5,
  },
  {
    value: "near_mint",
    label: "Near Mint",
    shortLabel: "NM",
    description: "Minimal wear. Light edge whitening allowed.",
    gradeRange: "PSA 7–8.5",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    multiplier: 1.0,
  },
  {
    value: "lightly_played",
    label: "Lightly Played",
    shortLabel: "LP",
    description: "Some wear visible. Minor scratches, light creasing.",
    gradeRange: "PSA 5–6.5",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    multiplier: 0.7,
  },
  {
    value: "moderately_played",
    label: "Moderately Played",
    shortLabel: "MP",
    description: "Noticeable wear. Creasing, edge wear, some scuffing.",
    gradeRange: "PSA 3–4.5",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    multiplier: 0.4,
  },
  {
    value: "heavily_played",
    label: "Heavily Played",
    shortLabel: "HP",
    description: "Significant wear. Heavy creasing, major edge damage.",
    gradeRange: "PSA 1–2.5",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    multiplier: 0.2,
  },
  {
    value: "damaged",
    label: "Damaged",
    shortLabel: "DMG",
    description: "Major damage. Tears, water damage, writing, bends.",
    gradeRange: "Below PSA 1",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    multiplier: 0.1,
  },
];

// Quick lookup maps
export const CONDITION_BY_VALUE: Record<string, ConditionInfo> = Object.fromEntries(
  CONDITIONS.map((c) => [c.value, c])
);

export const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  CONDITIONS.map((c) => [c.value, c.shortLabel])
);

export const CONDITION_FULL_LABELS: Record<string, string> = Object.fromEntries(
  CONDITIONS.map((c) => [c.value, `${c.label} (${c.shortLabel})`])
);

// For backward compatibility — maps old condition values to new ones
export const LEGACY_CONDITION_MAP: Record<string, string> = {
  excellent: "near_mint",
  good: "lightly_played",
  played: "moderately_played",
  poor: "damaged",
};

/** Get condition info, handling legacy values */
export function getConditionInfo(value: string): ConditionInfo {
  const mapped = LEGACY_CONDITION_MAP[value] || value;
  return CONDITION_BY_VALUE[mapped] || CONDITION_BY_VALUE["near_mint"];
}

/** Calculate value based on condition (NM is baseline) */
export function getConditionValue(marketValue: number | null, conditionValue: string): number {
  if (!marketValue) return 0;
  const info = getConditionInfo(conditionValue);
  return Math.round(marketValue * info.multiplier * 100) / 100;
}

/** Get value impact display for all conditions */
export function getValueImpactDisplay(marketValue: number | null): { label: string; value: number; color: string }[] {
  if (!marketValue) return [];
  return CONDITIONS.map((c) => ({
    label: c.shortLabel,
    value: Math.round(marketValue * c.multiplier * 100) / 100,
    color: c.color,
  }));
}
