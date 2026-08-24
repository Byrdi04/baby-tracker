// lib/growthTables.ts
// WHO weight-for-age reference tables using official WHO LMS parameters.
// Instead of storing 10 percentile columns, we store the 3 LMS parameters
// (L = Box-Cox power, M = median, S = coefficient of variation) per month,
// which is the WHO's canonical representation.
//
// Percentile reference lines (p01-p85) are DERIVED from LMS when needed
// (e.g., for charting reference curves).
//
// Source: WHO Child Growth Standards - LMS tables
//   Boys:  https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-boys-zscore-expanded-table.pdf
//   Girls: https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-girls-zscore-expanded-table.pdf

export type LmsPoint = {
  month: number;
  L: number;
  M: number;
  S: number;
};

export type GrowthPointDate = {
  date: string;
  L: number;
  M: number;
  S: number;
  /** Derived percentile reference lines (used by charts). */
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

/** Exact number of days per WHO month (365.25 / 12). */
const DAYS_PER_MONTH = 30.4375;

/** z-score for each percentile we render as reference lines. */
const PERCENTILE_Z: Record<string, number> = {
  p01: -3.0905,
  p1: -2.3268,
  p3: -1.8812,
  p5: -1.6452,
  p10: -1.2817,
  p15: -1.0364,
  p25: -0.6742,
  p50: 0,
  p75: 0.6742,
  p85: 1.0364,
};

/** Convert a z-score to a weight using the WHO LMS formula. */
export function zToWeight(z: number, L: number, M: number, S: number): number {
  if (Math.abs(L) < 0.0001) return M * Math.exp(z * S);
  return M * Math.pow(1 + L * z * S, 1 / L);
}

// -- WHO Male LMS Parameters (0-24 months) -------------------------
// Source: WHO MGRS, weight-for-age BOYS
export const LMS_MALE: LmsPoint[] = [
  { month: 0,  L: 0.3487, M: 3.3464, S: 0.14602 },
  { month: 1,  L: 0.2297, M: 4.4709, S: 0.13395 },
  { month: 2,  L: 0.1970, M: 5.5675, S: 0.12385 },
  { month: 3,  L: 0.1735, M: 6.3762, S: 0.11727 },
  { month: 4,  L: 0.1553, M: 7.0023, S: 0.11316 },
  { month: 5,  L: 0.1715, M: 7.5105, S: 0.11080 },
  { month: 6,  L: 0.1532, M: 7.9297, S: 0.10958 },
  { month: 7,  L: 0.1241, M: 8.2904, S: 0.10895 },
  { month: 8,  L: 0.1026, M: 8.6069, S: 0.10870 },
  { month: 9,  L: 0.0918, M: 8.8896, S: 0.10873 },
  { month: 10, L: 0.0824, M: 9.1456, S: 0.10896 },
  { month: 11, L: 0.0754, M: 9.3805, S: 0.10935 },
  { month: 12, L: 0.0702, M: 9.5982, S: 0.10984 },
  { month: 13, L: 0.0663, M: 9.8017, S: 0.11042 },
  { month: 14, L: 0.0635, M: 9.9930, S: 0.11107 },
  { month: 15, L: 0.0617, M: 10.1736, S: 0.11178 },
  { month: 16, L: 0.0606, M: 10.3447, S: 0.11253 },
  { month: 17, L: 0.0602, M: 10.5072, S: 0.11331 },
  { month: 18, L: 0.0603, M: 10.6618, S: 0.11411 },
  { month: 19, L: 0.0608, M: 10.8091, S: 0.11493 },
  { month: 20, L: 0.0617, M: 10.9497, S: 0.11576 },
  { month: 21, L: 0.0629, M: 11.0842, S: 0.11659 },
  { month: 22, L: 0.0643, M: 11.2130, S: 0.11743 },
  { month: 23, L: 0.0658, M: 11.3365, S: 0.11827 },
  { month: 24, L: 0.0674, M: 11.4550, S: 0.11911 },
];

// -- WHO Female LMS Parameters (0-24 months) -----------------------
// Source: WHO MGRS, weight-for-age GIRLS
export const LMS_FEMALE: LmsPoint[] = [
  { month: 0,  L: 0.3803, M: 3.2322, S: 0.14172 },
  { month: 1,  L: 0.1714, M: 4.1873, S: 0.13724 },
  { month: 2,  L: 0.0962, M: 5.1282, S: 0.12994 },
  { month: 3,  L: 0.0402, M: 5.8458, S: 0.12428 },
  { month: 4,  L: -0.0050, M: 6.4237, S: 0.12027 },
  { month: 5,  L: -0.0430, M: 6.8985, S: 0.11742 },
  { month: 6,  L: -0.0756, M: 7.2970, S: 0.11544 },
  { month: 7,  L: -0.1039, M: 7.6422, S: 0.11402 },
  { month: 8,  L: -0.1288, M: 7.9487, S: 0.11298 },
  { month: 9,  L: -0.1507, M: 8.2254, S: 0.11221 },
  { month: 10, L: -0.1700, M: 8.4800, S: 0.11164 },
  { month: 11, L: -0.1872, M: 8.7168, S: 0.11123 },
  { month: 12, L: -0.2024, M: 8.9388, S: 0.11093 },
  { month: 13, L: -0.2158, M: 9.1480, S: 0.11074 },
  { month: 14, L: -0.2277, M: 9.3459, S: 0.11062 },
  { month: 15, L: -0.2382, M: 9.5337, S: 0.11057 },
  { month: 16, L: -0.2475, M: 9.7123, S: 0.11058 },
  { month: 17, L: -0.2557, M: 9.8824, S: 0.11065 },
  { month: 18, L: -0.2629, M: 10.0445, S: 0.11077 },
  { month: 19, L: -0.2692, M: 10.1993, S: 0.11093 },
  { month: 20, L: -0.2747, M: 10.3473, S: 0.11114 },
  { month: 21, L: -0.2795, M: 10.4890, S: 0.11139 },
  { month: 22, L: -0.2836, M: 10.6249, S: 0.11168 },
  { month: 23, L: -0.2872, M: 10.7554, S: 0.11200 },
  { month: 24, L: -0.2902, M: 10.8808, S: 0.11236 },
];

export function getLmsTable(gender: 'male' | 'female'): LmsPoint[] {
  return gender === 'female' ? LMS_FEMALE : LMS_MALE;
}

/** Convert a month (0-24) to the ISO date using WHO 30.4375-day months. */
export function monthToDate(month: number, birthDate: string): string {
  const birth = new Date(birthDate + 'T00:00:00');
  return new Date(birth.getTime() + month * DAYS_PER_MONTH * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
}

/** Build a GrowthPointDate array from the LMS table, deriving percentile reference lines.
 * When `shiftMs` is provided, adds it to each month-derived timestamp
 * (used for corrected-age charts). */
export function toPercentilePoints(
  gender: 'male' | 'female',
  birthDate: string,
  shiftMs = 0
): GrowthPointDate[] {
  const table = getLmsTable(gender);
  const percentileKeys = Object.keys(PERCENTILE_Z) as (keyof typeof PERCENTILE_Z)[];
  return table.map(point => {
    const birth = new Date(birthDate + 'T00:00:00');
    const target = new Date(birth.getTime() + point.month * DAYS_PER_MONTH * 24 * 60 * 60 * 1000 + shiftMs);
    const percentiles: Record<string, number> = {};
    for (const key of percentileKeys) {
      percentiles[key] = parseFloat(zToWeight(PERCENTILE_Z[key], point.L, point.M, point.S).toFixed(1));
    }
    return {
      date: target.toISOString().split('T')[0],
      L: point.L,
      M: point.M,
      S: point.S,
      p01: percentiles.p01,
      p1: percentiles.p1,
      p3: percentiles.p3,
      p5: percentiles.p5,
      p10: percentiles.p10,
      p15: percentiles.p15,
      p25: percentiles.p25,
      p50: percentiles.p50,
      p75: percentiles.p75,
      p85: percentiles.p85,
    };
  });
}