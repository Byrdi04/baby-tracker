// lib/growthUtils.ts
// WHO percentile calculation using the official LMS z-score method.
//
// The WHO defines child growth percentiles via the Box-Cox transformation:
//   z = ((weight / M)^L - 1) / (L * S)
//   percentile = Phi(z) * 100
//
// Where L, M, S are age-specific parameters from the WHO MGRS study.

/** A growth data point with interpolated LMS parameters for a specific date. */
type LmsInterpolated = {
  date: string;
  L: number;
  M: number;
  S: number;
};

/**
 * Standard normal CDF via error function approximation (Abramowitz and Stegun 26.2.17).
 * Accurate to ~1.5e-7.
 */
function normalCdf(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

/**
 * Calculate the percentile of a weight at a specific time using the WHO LMS method.
 *
 * @param weight  The baby's weight in kg.
 * @param eventTime  The timestamp of the measurement (string or number).
 * @param growthData  Array of GrowthPointDate from toPercentilePoints().
 * @returns A formatted percentile string (e.g. "28%", "0.4%", "> 85%") or null if out of range.
 */
export const calculateInterpolatedPercentile = (
  weight: number,
  eventTime: string | number,
  growthData: LmsInterpolated[]
): string | null => {
  const eventDate = new Date(eventTime).getTime();

  // 1. Sort data by date
  const sortedData = [...growthData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 2. Find the surrounding data points
  let lowerPoint: LmsInterpolated | null = null;
  let upperPoint: LmsInterpolated | null = null;

  for (let i = 0; i < sortedData.length - 1; i++) {
    const currT = new Date(sortedData[i].date).getTime();
    const nextT = new Date(sortedData[i + 1].date).getTime();
    if (eventDate >= currT && eventDate < nextT) {
      lowerPoint = sortedData[i];
      upperPoint = sortedData[i + 1];
      break;
    }
  }

  if (!lowerPoint || !upperPoint) {
    return null;
  }

  // 3. Interpolate L, M, S linearly between the two surrounding months
  const lowerTime = new Date(lowerPoint.date).getTime();
  const upperTime = new Date(upperPoint.date).getTime();
  const timeRange = upperTime - lowerTime;
  const timeOffset = eventDate - lowerTime;
  const factor = timeRange > 0 ? timeOffset / timeRange : 0;

  const L = lowerPoint.L + (upperPoint.L - lowerPoint.L) * factor;
  const M = lowerPoint.M + (upperPoint.M - lowerPoint.M) * factor;
  const S = lowerPoint.S + (upperPoint.S - lowerPoint.S) * factor;

  // 4. Compute the z-score using the WHO LMS formula
  let z: number;
  if (Math.abs(L) < 0.0001) {
    // L near zero: log-normal case
    z = Math.log(weight / M) / S;
  } else {
    // Box-Cox transformation
    z = (Math.pow(weight / M, L) - 1) / (L * S);
  }

  // 5. Convert z-score to percentile
  let percentile = normalCdf(z) * 100;

  // Clamp to our display range
  if (percentile < 0.1) return '< 0.1%';
  if (percentile > 85) return '> 85%';

  // Format: one decimal place if < 1%, round to nearest whole otherwise
  if (percentile < 1) {
    return `${percentile.toFixed(1)}%`;
  }
  return `${Math.round(percentile)}%`;
};