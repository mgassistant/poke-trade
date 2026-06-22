import { NextRequest, NextResponse } from "next/server";

interface SubgradeInput {
  centering: number;
  corners: number;
  edges: number;
  surface: number;
}

const WEIGHTS = {
  centering: 0.2,
  corners: 0.3,
  edges: 0.25,
  surface: 0.25,
};

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

function gradeToCondition(grade: number): string {
  if (grade >= 10) return "gem_mint";
  if (grade >= 9) return "mint";
  if (grade >= 7) return "near_mint";
  if (grade >= 5) return "lightly_played";
  if (grade >= 3) return "moderately_played";
  if (grade >= 1) return "heavily_played";
  return "damaged";
}

// POST /api/cards/grade-estimate — Calculate estimated PSA grade from subgrades
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { centering, corners, edges, surface } = body as SubgradeInput;

  // Validate inputs
  const subgrades = { centering, corners, edges, surface };
  for (const [key, val] of Object.entries(subgrades)) {
    if (typeof val !== "number" || val < 0 || val > 10) {
      return NextResponse.json(
        { error: `Invalid ${key}: must be a number between 0 and 10` },
        { status: 400 }
      );
    }
  }

  // Calculate weighted average
  let weighted = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    weighted += (subgrades[key as keyof SubgradeInput] || 0) * weight;
  }

  // Round to nearest 0.5
  const estimatedGrade = Math.round(weighted * 2) / 2;

  return NextResponse.json({
    grade: estimatedGrade,
    label: getGradeLabel(estimatedGrade),
    condition: gradeToCondition(estimatedGrade),
    subgrades: {
      centering: { score: centering, weight: WEIGHTS.centering },
      corners: { score: corners, weight: WEIGHTS.corners },
      edges: { score: edges, weight: WEIGHTS.edges },
      surface: { score: surface, weight: WEIGHTS.surface },
    },
  });
}
