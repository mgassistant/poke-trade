/**
 * PSA Card Grading API Integration
 * API: https://api.psacard.com/publicapi/
 * 
 * Note: Free tier = 1 call/day. Results are cached in Supabase
 * to avoid hitting the limit. For production volume, contact
 * collectors-apis@collectors.com for a paid plan.
 */

const PSA_API_BASE = "https://api.psacard.com/publicapi";

export interface PSACertData {
  CertNumber: string;
  Subject: string;
  Category: string;
  CardNumber: string;
  Year: string;
  Brand: string;
  Variety: string;
  CardGrade: string;
  GradeDescription: string;
  LabelType: string;
  ReverseBarCode: string;
  TotalPopulation: number;
  PopulationHigher: number;
  IsDNA: boolean;
  IsDualCert: boolean;
  SpecNumber: string;
  SpecID: number;
  PSAImageFront: string | null;
  PSAImageBack: string | null;
}

export interface PSACertResult {
  success: boolean;
  data?: PSACertData;
  cached?: boolean;
  error?: string;
}

/**
 * Look up a PSA certification by cert number.
 */
export async function lookupPSACert(certNumber: string): Promise<PSACertResult> {
  const token = process.env.PSA_API_TOKEN;
  if (!token) {
    return { success: false, error: "PSA API not configured" };
  }

  const cleaned = certNumber.replace(/\D/g, "");
  if (!cleaned || cleaned.length < 5) {
    return { success: false, error: "Invalid cert number" };
  }

  try {
    const res = await fetch(`${PSA_API_BASE}/cert/GetByCertNumber/${cleaned}`, {
      headers: {
        Authorization: `bearer ${token}`,
      },
    });

    if (res.status === 429) {
      return { success: false, error: "PSA API rate limit reached. Try again tomorrow." };
    }

    if (!res.ok) {
      return { success: false, error: `PSA API error: ${res.status}` };
    }

    const data = await res.json();

    if (!data || data === "null" || (typeof data === "object" && !data.CertNumber)) {
      return { success: false, error: "Cert number not found" };
    }

    return { success: true, data: data as PSACertData };
  } catch (err: any) {
    return { success: false, error: err.message || "PSA lookup failed" };
  }
}

/**
 * Parse PSA grade string into numeric value.
 * e.g. "10" → 10, "MINT 9" → 9, "NM-MT 8" → 8
 */
export function parsePSAGrade(gradeStr: string): number | null {
  if (!gradeStr) return null;
  const match = gradeStr.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Get PSA grade label.
 */
export function getPSAGradeLabel(grade: number): string {
  const labels: Record<number, string> = {
    10: "Gem Mint",
    9: "Mint",
    8: "NM-MT",
    7: "Near Mint",
    6: "EX-MT",
    5: "Excellent",
    4: "VG-EX",
    3: "Very Good",
    2: "Good",
    1.5: "Fair",
    1: "Poor",
  };
  return labels[grade] || `PSA ${grade}`;
}
