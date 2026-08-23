// lib/growthTables.ts
// WHO weight-for-age reference tables (simplified MGRS data).
// Percentile bands: p01 (0.1%), p1 (1%), p3 (3%), p5 (5%), p10 (10%),
//   p15 (15%), p25 (25%), p50 (50%), p75 (75%), p85 (85%)
// Values in kilograms. Monthly intervals for 0–24 months.

export type GrowthPoint = {
  month: number;
  p01: number;
  p1: number;
  p3: number;
  p5: number;
  p10: number;
  p15: number;
  p25: number;
  p50: number;
  p75: number;
  p85: number;
};

export type GrowthPointDate = {
  date: string;
  p01: number;
  p1: number;
  p3: number;
  p5: number;
  p10: number;
  p15: number;
  p25: number;
  p50: number;
  p75: number;
  p85: number;
};

// ── WHO Male Weight-for-Age (0–24 months, kg) ─────────────────────
// Source: WHO Child Growth Standards — Weight-for-age (boys, 0–24 months)
export const GROWTH_MALE: GrowthPoint[] = [
  { month: 0,  p01: 2.4, p1: 2.6, p3: 2.7, p5: 2.8, p10: 3.0, p15: 3.1, p25: 3.2, p50: 3.3, p75: 3.5, p85: 3.7 },
  { month: 1,  p01: 3.4, p1: 3.6, p3: 3.7, p5: 3.8, p10: 4.0, p15: 4.1, p25: 4.3, p50: 4.5, p75: 4.7, p85: 4.9 },
  { month: 2,  p01: 4.3, p1: 4.5, p3: 4.6, p5: 4.7, p10: 4.9, p15: 5.1, p25: 5.3, p50: 5.6, p75: 5.9, p85: 6.2 },
  { month: 3,  p01: 5.0, p1: 5.2, p3: 5.3, p5: 5.4, p10: 5.6, p15: 5.8, p25: 6.0, p50: 6.4, p75: 6.7, p85: 7.1 },
  { month: 4,  p01: 5.6, p1: 5.8, p3: 5.9, p5: 6.0, p10: 6.2, p15: 6.4, p25: 6.6, p50: 7.0, p75: 7.3, p85: 7.7 },
  { month: 5,  p01: 6.0, p1: 6.2, p3: 6.3, p5: 6.4, p10: 6.7, p15: 6.9, p25: 7.1, p50: 7.6, p75: 7.9, p85: 8.3 },
  { month: 6,  p01: 6.4, p1: 6.5, p3: 6.7, p5: 6.8, p10: 7.0, p15: 7.2, p25: 7.5, p50: 7.9, p75: 8.3, p85: 8.7 },
  { month: 7,  p01: 6.7, p1: 6.9, p3: 7.0, p5: 7.1, p10: 7.4, p15: 7.6, p25: 7.8, p50: 8.3, p75: 8.6, p85: 9.0 },
  { month: 8,  p01: 7.0, p1: 7.1, p3: 7.3, p5: 7.4, p10: 7.6, p15: 7.8, p25: 8.1, p50: 8.6, p75: 8.9, p85: 9.3 },
  { month: 9,  p01: 7.2, p1: 7.4, p3: 7.5, p5: 7.6, p10: 7.9, p15: 8.1, p25: 8.3, p50: 8.9, p75: 9.2, p85: 9.6 },
  { month: 10, p01: 7.4, p1: 7.6, p3: 7.7, p5: 7.8, p10: 8.1, p15: 8.3, p25: 8.5, p50: 9.1, p75: 9.5, p85: 9.9 },
  { month: 11, p01: 7.6, p1: 7.8, p3: 7.9, p5: 8.0, p10: 8.3, p15: 8.5, p25: 8.7, p50: 9.3, p75: 9.7, p85: 10.1 },
  { month: 12, p01: 7.8, p1: 7.9, p3: 8.1, p5: 8.2, p10: 8.5, p15: 8.7, p25: 8.9, p50: 9.6, p75: 10.0, p85: 10.4 },
  { month: 13, p01: 7.9, p1: 8.1, p3: 8.2, p5: 8.3, p10: 8.6, p15: 8.8, p25: 9.0, p50: 9.8, p75: 10.2, p85: 10.6 },
  { month: 14, p01: 8.1, p1: 8.2, p3: 8.4, p5: 8.5, p10: 8.8, p15: 9.0, p25: 9.2, p50: 10.0, p75: 10.4, p85: 10.8 },
  { month: 15, p01: 8.2, p1: 8.4, p3: 8.5, p5: 8.6, p10: 8.9, p15: 9.1, p25: 9.3, p50: 10.2, p75: 10.6, p85: 11.0 },
  { month: 16, p01: 8.4, p1: 8.5, p3: 8.6, p5: 8.8, p10: 9.1, p15: 9.3, p25: 9.5, p50: 10.4, p75: 10.8, p85: 11.2 },
  { month: 17, p01: 8.5, p1: 8.6, p3: 8.8, p5: 8.9, p10: 9.2, p15: 9.4, p25: 9.6, p50: 10.6, p75: 11.0, p85: 11.3 },
  { month: 18, p01: 8.6, p1: 8.8, p3: 8.9, p5: 9.0, p10: 9.3, p15: 9.5, p25: 9.7, p50: 10.7, p75: 11.2, p85: 11.5 },
  { month: 19, p01: 8.7, p1: 8.9, p3: 9.0, p5: 9.1, p10: 9.4, p15: 9.6, p25: 9.8, p50: 10.9, p75: 11.3, p85: 11.7 },
  { month: 20, p01: 8.9, p1: 9.0, p3: 9.1, p5: 9.2, p10: 9.5, p15: 9.7, p25: 9.9, p50: 11.0, p75: 11.5, p85: 11.8 },
  { month: 21, p01: 9.0, p1: 9.1, p3: 9.2, p5: 9.3, p10: 9.6, p15: 9.8, p25: 10.0, p50: 11.2, p75: 11.6, p85: 11.9 },
  { month: 22, p01: 9.1, p1: 9.2, p3: 9.3, p5: 9.4, p10: 9.7, p15: 9.9, p25: 10.1, p50: 11.3, p75: 11.7, p85: 12.0 },
  { month: 23, p01: 9.2, p1: 9.3, p3: 9.4, p5: 9.5, p10: 9.8, p15: 10.0, p25: 10.2, p50: 11.4, p75: 11.9, p85: 12.1 },
  { month: 24, p01: 9.3, p1: 9.4, p3: 9.5, p5: 9.6, p10: 9.9, p15: 10.1, p25: 10.3, p50: 11.5, p75: 12.0, p85: 12.2 },
];

// ── WHO Female Weight-for-Age (0–24 months, kg) ───────────────────
// Source: WHO Child Growth Standards — Weight-for-age (girls, 0–24 months)
export const GROWTH_FEMALE: GrowthPoint[] = [
  { month: 0,  p01: 2.2, p1: 2.4, p3: 2.5, p5: 2.6, p10: 2.7, p15: 2.8, p25: 2.9, p50: 3.2, p75: 3.4, p85: 3.6 },
  { month: 1,  p01: 3.1, p1: 3.3, p3: 3.4, p5: 3.5, p10: 3.6, p15: 3.7, p25: 3.9, p50: 4.2, p75: 4.5, p85: 4.8 },
  { month: 2,  p01: 3.9, p1: 4.1, p3: 4.2, p5: 4.3, p10: 4.5, p15: 4.6, p25: 4.8, p50: 5.3, p75: 5.6, p85: 5.9 },
  { month: 3,  p01: 4.6, p1: 4.8, p3: 4.9, p5: 5.0, p10: 5.2, p15: 5.3, p25: 5.6, p50: 6.0, p75: 6.4, p85: 6.8 },
  { month: 4,  p01: 5.2, p1: 5.4, p3: 5.5, p5: 5.6, p10: 5.8, p15: 5.9, p25: 6.2, p50: 6.7, p75: 7.1, p85: 7.5 },
  { month: 5,  p01: 5.6, p1: 5.8, p3: 5.9, p5: 6.0, p10: 6.3, p15: 6.4, p25: 6.7, p50: 7.2, p75: 7.7, p85: 8.1 },
  { month: 6,  p01: 6.0, p1: 6.2, p3: 6.3, p5: 6.4, p10: 6.7, p15: 6.8, p25: 7.1, p50: 7.6, p75: 8.1, p85: 8.5 },
  { month: 7,  p01: 6.3, p1: 6.5, p3: 6.6, p5: 6.7, p10: 7.0, p15: 7.1, p25: 7.4, p50: 8.0, p75: 8.5, p85: 8.9 },
  { month: 8,  p01: 6.6, p1: 6.7, p3: 6.9, p5: 7.0, p10: 7.2, p15: 7.4, p25: 7.7, p50: 8.3, p75: 8.8, p85: 9.3 },
  { month: 9,  p01: 6.8, p1: 7.0, p3: 7.1, p5: 7.2, p10: 7.5, p15: 7.6, p25: 7.9, p50: 8.6, p75: 9.1, p85: 9.6 },
  { month: 10, p01: 7.0, p1: 7.2, p3: 7.3, p5: 7.4, p10: 7.7, p15: 7.9, p25: 8.2, p50: 8.9, p75: 9.4, p85: 9.9 },
  { month: 11, p01: 7.2, p1: 7.4, p3: 7.5, p5: 7.6, p10: 7.9, p15: 8.1, p25: 8.4, p50: 9.1, p75: 9.7, p85: 10.2 },
  { month: 12, p01: 7.4, p1: 7.5, p3: 7.7, p5: 7.8, p10: 8.1, p15: 8.3, p25: 8.6, p50: 9.4, p75: 9.9, p85: 10.5 },
  { month: 13, p01: 7.6, p1: 7.7, p3: 7.9, p5: 8.0, p10: 8.3, p15: 8.5, p25: 8.8, p50: 9.6, p75: 10.2, p85: 10.7 },
  { month: 14, p01: 7.7, p1: 7.9, p3: 8.0, p5: 8.1, p10: 8.4, p15: 8.6, p25: 8.9, p50: 9.8, p75: 10.4, p85: 11.0 },
  { month: 15, p01: 7.9, p1: 8.0, p3: 8.2, p5: 8.3, p10: 8.6, p15: 8.8, p25: 9.1, p50: 10.0, p75: 10.6, p85: 11.2 },
  { month: 16, p01: 8.0, p1: 8.2, p3: 8.3, p5: 8.4, p10: 8.7, p15: 8.9, p25: 9.2, p50: 10.2, p75: 10.8, p85: 11.4 },
  { month: 17, p01: 8.2, p1: 8.3, p3: 8.4, p5: 8.6, p10: 8.9, p15: 9.1, p25: 9.4, p50: 10.4, p75: 11.0, p85: 11.6 },
  { month: 18, p01: 8.3, p1: 8.4, p3: 8.6, p5: 8.7, p10: 9.0, p15: 9.2, p25: 9.5, p50: 10.5, p75: 11.2, p85: 11.8 },
  { month: 19, p01: 8.4, p1: 8.6, p3: 8.7, p5: 8.8, p10: 9.1, p15: 9.3, p25: 9.6, p50: 10.7, p75: 11.3, p85: 12.0 },
  { month: 20, p01: 8.5, p1: 8.7, p3: 8.8, p5: 8.9, p10: 9.2, p15: 9.4, p25: 9.7, p50: 10.9, p75: 11.5, p85: 12.1 },
  { month: 21, p01: 8.7, p1: 8.8, p3: 8.9, p5: 9.0, p10: 9.3, p15: 9.5, p25: 9.8, p50: 11.0, p75: 11.6, p85: 12.2 },
  { month: 22, p01: 8.8, p1: 8.9, p3: 9.0, p5: 9.2, p10: 9.4, p15: 9.6, p25: 9.9, p50: 11.1, p75: 11.7, p85: 12.3 },
  { month: 23, p01: 8.9, p1: 9.0, p3: 9.1, p5: 9.3, p10: 9.5, p15: 9.7, p25: 10.0, p50: 11.3, p75: 11.9, p85: 12.5 },
  { month: 24, p01: 9.0, p1: 9.1, p3: 9.2, p5: 9.4, p10: 9.6, p15: 9.8, p25: 10.1, p50: 11.4, p75: 12.0, p85: 12.6 },
];

/** Return the appropriate growth table based on gender. */
export function getGrowthTable(gender: 'male' | 'female'): GrowthPoint[] {
  return gender === 'female' ? GROWTH_FEMALE : GROWTH_MALE;
}

/** Convert a month (0–24) to the ISO date used by the weight page format. */
export function monthToDate(month: number, birthDate: string): string {
  const birth = new Date(birthDate + 'T00:00:00');
  const target = new Date(birth);
  target.setMonth(target.getMonth() + month);
  return target.toISOString().split('T')[0];
}

/** Convert the growth table to the format expected by calculateInterpolatedPercentile.
 * When `shiftMs` is provided, adds it to each month-derived timestamp
 * (used for corrected-age charts). */
export function toPercentilePoints(
  gender: 'male' | 'female',
  birthDate: string,
  shiftMs = 0
): GrowthPointDate[] {
  const table = getGrowthTable(gender);
  return table.map(point => {
    const birth = new Date(birthDate + 'T00:00:00');
    const target = new Date(birth);
    target.setMonth(target.getMonth() + point.month);
    const shifted = new Date(target.getTime() + shiftMs);
    return {
      date: shifted.toISOString().split('T')[0],
      p01: point.p01,
      p1: point.p1,
      p3: point.p3,
      p5: point.p5,
      p10: point.p10,
      p15: point.p15,
      p25: point.p25,
      p50: point.p50,
      p75: point.p75,
      p85: point.p85,
    };
  });
}
