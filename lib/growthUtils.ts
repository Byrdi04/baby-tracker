// lib/growthUtils.ts

type GrowthPoint = {
  date: string;
  p01: number; // 0.1%
  p1: number;  // 1%
  p3: number;  // 3%
  p5: number;  // 5%
  p10: number; // 10%
  p15: number;
  p25: number;
  p50: number;
  p75: number;
  p85: number;
  [key: string]: any; // Allow for other props
};

/**
 * Calculates the exact percentile of a weight at a specific point in time
 * by interpolating between the surrounding WHO data points.
 */
export const calculateInterpolatedPercentile = (
  weight: number, 
  eventTime: string | number, 
  growthData: GrowthPoint[]
): string | null => {
  const eventDate = new Date(eventTime).getTime();

  // 1. Sort data just in case
  const sortedData = [...growthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Find the surrounding data points (Time Interpolation)
  let lowerPoint: GrowthPoint | null = null;
  let upperPoint: GrowthPoint | null = null;

  for (let i = 0; i < sortedData.length - 1; i++) {
    const currT = new Date(sortedData[i].date).getTime();
    const nextT = new Date(sortedData[i + 1].date).getTime();

    if (eventDate >= currT && eventDate < nextT) {
      lowerPoint = sortedData[i];
      upperPoint = sortedData[i + 1];
      break;
    }
  }

  // Handle Edge Cases (Before start or After end)
  if (!lowerPoint || !upperPoint) {
    return null;
  }

  // 3. Calculate Time Factor (0.0 to 1.0)
  const lowerTime = new Date(lowerPoint.date).getTime();
  const upperTime = new Date(upperPoint.date).getTime();
  const timeRange = upperTime - lowerTime;
  const timeOffset = eventDate - lowerTime;
  const factor = timeOffset / timeRange;

  // 4. Interpolate Reference Values for this exact moment
  const refP01 = lowerPoint.p01 + (upperPoint.p01 - lowerPoint.p01) * factor;
  const refP1 = lowerPoint.p1 + (upperPoint.p1 - lowerPoint.p1) * factor;
  const refP3 = lowerPoint.p3 + (upperPoint.p3 - lowerPoint.p3) * factor;
  const refP5 = lowerPoint.p5 + (upperPoint.p5 - lowerPoint.p5) * factor;
  const refP10 = lowerPoint.p10 + (upperPoint.p10 - lowerPoint.p10) * factor;
  const refP15 = lowerPoint.p15 + (upperPoint.p15 - lowerPoint.p15) * factor;
  const refP25 = lowerPoint.p25 + (upperPoint.p25 - lowerPoint.p25) * factor;
  const refP50 = lowerPoint.p50 + (upperPoint.p50 - lowerPoint.p50) * factor;
  const refP75 = lowerPoint.p75 + (upperPoint.p75 - lowerPoint.p75) * factor;
  const refP85 = lowerPoint.p85 + (upperPoint.p85 - lowerPoint.p85) * factor;

  // 5. Calculate Percentile Rank (Weight Interpolation)
  
  // Below lowest band
  if (weight <= refP01) return '< 0.1%';
  // Above highest band
  if (weight >= refP85) return '> 85%';

  // Find which band the weight falls into
  let lowerP = 0, lowerVal = 0, upperP = 0, upperVal = 0;

  if (weight < refP1)       { lowerP = 0.1; lowerVal = refP01; upperP = 1; upperVal = refP1; }
  else if (weight < refP3)  { lowerP = 1;   lowerVal = refP1;  upperP = 3; upperVal = refP3; }
  else if (weight < refP5)  { lowerP = 3;   lowerVal = refP3;  upperP = 5; upperVal = refP5; }
  else if (weight < refP10) { lowerP = 5;   lowerVal = refP5;  upperP = 10; upperVal = refP10; }
  else if (weight < refP15) { lowerP = 10;  lowerVal = refP10; upperP = 15; upperVal = refP15; }
  else if (weight < refP25) { lowerP = 15;  lowerVal = refP15; upperP = 25; upperVal = refP25; }
  else if (weight < refP50) { lowerP = 25;  lowerVal = refP25; upperP = 50; upperVal = refP50; }
  else if (weight < refP75) { lowerP = 50;  lowerVal = refP50; upperP = 75; upperVal = refP75; }
  else                      { lowerP = 75;  lowerVal = refP75; upperP = 85; upperVal = refP85; }

  // Linear Interpolation within the band
  const rangeWeight = upperVal - lowerVal;
  const rangePercent = upperP - lowerP;
  const weightOffset = weight - lowerVal;
  const fraction = weightOffset / rangeWeight;
  
  const exactPercentile = lowerP + (fraction * rangePercent);

  // If the percentile is less than 1, show 1 decimal place (e.g. "0.4%")
  if (exactPercentile < 1) {
    return `${exactPercentile.toFixed(1)}%`;
  }
  
  // Otherwise round to the nearest whole number (e.g. "50%")
  return `${Math.round(exactPercentile)}%`;
};