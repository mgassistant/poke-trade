"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONDITIONS, getConditionValue } from "@/lib/constants/conditions";

interface SubgradeOption {
  label: string;
  value: number;
}

interface SubgradeCategory {
  name: string;
  icon: string;
  weight: number;
  options: SubgradeOption[];
}

const SUBGRADES: SubgradeCategory[] = [
  {
    name: "Centering",
    icon: "⊞",
    weight: 0.2,
    options: [
      { label: "Perfect", value: 10 },
      { label: "Slightly Off", value: 8 },
      { label: "Noticeably Off", value: 5 },
      { label: "Way Off", value: 2 },
    ],
  },
  {
    name: "Corners",
    icon: "◇",
    weight: 0.3,
    options: [
      { label: "Sharp", value: 10 },
      { label: "Light Wear", value: 7.5 },
      { label: "Moderate Wear", value: 5 },
      { label: "Heavy Wear", value: 2 },
    ],
  },
  {
    name: "Edges",
    icon: "▬",
    weight: 0.25,
    options: [
      { label: "Clean", value: 10 },
      { label: "Light Whitening", value: 7.5 },
      { label: "Moderate Whitening", value: 5 },
      { label: "Heavy Whitening", value: 2 },
    ],
  },
  {
    name: "Surface",
    icon: "◻",
    weight: 0.25,
    options: [
      { label: "Pristine", value: 10 },
      { label: "Light Scratches", value: 7.5 },
      { label: "Scratches", value: 5 },
      { label: "Heavy Damage", value: 2 },
    ],
  },
];

function getGradeLabel(grade: number): string {
  if (grade >= 10) return "Gem Mint (GM 10)";
  if (grade >= 9) return "Mint (M 9)";
  if (grade >= 8) return "Near Mint-Mint (NM-MT 8)";
  if (grade >= 7) return "Near Mint (NM 7)";
  if (grade >= 6) return "Excellent-Near Mint (EX-NM 6)";
  if (grade >= 5) return "Excellent (EX 5)";
  if (grade >= 4) return "Very Good-Excellent (VG-EX 4)";
  if (grade >= 3) return "Very Good (VG 3)";
  if (grade >= 2) return "Good (G 2)";
  return "Poor (P 1)";
}

function getGradeColor(grade: number): string {
  if (grade >= 9) return "text-emerald-600";
  if (grade >= 7) return "text-green-600";
  if (grade >= 5) return "text-yellow-600";
  return "text-red-500";
}

function getGradeBgColor(grade: number): string {
  if (grade >= 9) return "bg-emerald-50 border-emerald-200";
  if (grade >= 7) return "bg-green-50 border-green-200";
  if (grade >= 5) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function gradeToConditionValue(grade: number): string {
  if (grade >= 10) return "gem_mint";
  if (grade >= 9) return "mint";
  if (grade >= 7) return "near_mint";
  if (grade >= 5) return "lightly_played";
  if (grade >= 3) return "moderately_played";
  if (grade >= 1) return "heavily_played";
  return "damaged";
}

interface GradeEstimatorProps {
  marketValue?: number | null;
  onGradeChange?: (grade: number, conditionValue: string) => void;
  compact?: boolean;
}

export default function GradeEstimator({
  marketValue,
  onGradeChange,
  compact = false,
}: GradeEstimatorProps) {
  const [selections, setSelections] = useState<Record<string, number>>({});

  const allSelected = SUBGRADES.every((sg) => selections[sg.name] !== undefined);

  const estimatedGrade = useMemo(() => {
    if (!allSelected) return null;
    let weighted = 0;
    for (const sg of SUBGRADES) {
      weighted += (selections[sg.name] || 0) * sg.weight;
    }
    // Round to nearest 0.5
    return Math.round(weighted * 2) / 2;
  }, [selections, allSelected]);

  const conditionValue = estimatedGrade !== null ? gradeToConditionValue(estimatedGrade) : null;
  const conditionInfo = conditionValue
    ? CONDITIONS.find((c) => c.value === conditionValue)
    : null;

  // Notify parent of grade changes
  const handleSelect = (categoryName: string, value: number) => {
    const newSelections = { ...selections, [categoryName]: value };
    setSelections(newSelections);

    const allDone = SUBGRADES.every((sg) => newSelections[sg.name] !== undefined);
    if (allDone) {
      let weighted = 0;
      for (const sg of SUBGRADES) {
        weighted += (newSelections[sg.name] || 0) * sg.weight;
      }
      const grade = Math.round(weighted * 2) / 2;
      onGradeChange?.(grade, gradeToConditionValue(grade));
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold">PSA Grade Estimator</span>
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Beta</span>
      </div>

      {/* Subgrade selectors */}
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {SUBGRADES.map((sg) => (
          <div key={sg.name}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs">{sg.icon}</span>
              <span className="text-xs font-medium">{sg.name}</span>
              <span className="text-[10px] text-muted-foreground">({Math.round(sg.weight * 100)}%)</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {sg.options.map((opt) => {
                const isSelected = selections[sg.name] === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(sg.name, opt.value)}
                    className={`
                      px-2 py-1.5 rounded-md text-[11px] font-medium border transition-all
                      ${isSelected
                        ? opt.value >= 9
                          ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                          : opt.value >= 7
                            ? "bg-green-100 border-green-400 text-green-700"
                            : opt.value >= 5
                              ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                              : "bg-red-100 border-red-400 text-red-700"
                        : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Result */}
      {estimatedGrade !== null && (
        <div className={`rounded-lg border p-3 ${getGradeBgColor(estimatedGrade)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-lg font-bold ${getGradeColor(estimatedGrade)}`}>
                PSA {estimatedGrade}
              </div>
              <div className="text-xs text-muted-foreground">
                {getGradeLabel(estimatedGrade)}
              </div>
            </div>
            {conditionInfo && (
              <div className={`text-right`}>
                <div className={`text-sm font-semibold ${conditionInfo.color}`}>
                  {conditionInfo.label}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  TCG Condition
                </div>
              </div>
            )}
          </div>

          {/* Value impact */}
          {marketValue && marketValue > 0 && (
            <div className="mt-2 pt-2 border-t border-current/10">
              <div className="text-[10px] text-muted-foreground mb-1">Estimated Value by Condition</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {CONDITIONS.slice(0, 5).map((c) => {
                  const val = getConditionValue(marketValue, c.value);
                  const isActive = c.value === conditionValue;
                  return (
                    <span
                      key={c.value}
                      className={`text-[11px] ${isActive ? `font-bold ${c.color}` : "text-muted-foreground"}`}
                    >
                      {c.shortLabel}: ${val.toFixed(2)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-2 text-[10px] text-muted-foreground italic">
            ⚠ This is an estimate. Professional grading may differ.
          </div>
        </div>
      )}

      {!allSelected && (
        <p className="text-[11px] text-muted-foreground">
          Select all 4 areas above to see your estimated grade.
        </p>
      )}
    </div>
  );
}
