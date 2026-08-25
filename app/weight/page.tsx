export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import WeightChartSection from '@/components/weight/WeightChartSection';
import StatCard from '@/components/ui/StatCard';
import { calculateInterpolatedPercentile } from '@/lib/growthUtils';
import { toPercentilePoints } from '@/lib/growthTables';
import { getBabyBirthday, getBabyGender, isPrematurityActive, getDueDateOffsetMs } from '@/lib/settings';
import EventList from '@/components/events/EventList';
import PercentileChart from '@/components/weight/PercentileChart';

export default function WeightPage() {
  // 1. Fetch User Data
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'WEIGHT' 
    ORDER BY startTime ASC 
  `);
  const weightEventsAsc = stmt.all() as any[];
  const weightEventsDesc = [...weightEventsAsc].reverse();

  // 2. Load WHO growth data from settings
  const birthDate = getBabyBirthday();
  const gender = getBabyGender();
  const prematurityActive = isPrematurityActive();
  const offsetMs = getDueDateOffsetMs(); // 0 when prematurity is off

  // Actual-age growth data (no shift)
  const growthData = toPercentilePoints(gender, birthDate);

  // Corrected-age growth data (shifted so 0-month mark aligns with due date)
  const correctedGrowthData = prematurityActive && offsetMs > 0
    ? toPercentilePoints(gender, birthDate, offsetMs)
    : growthData;

  // ============================================================
  // STATISTICS CALCULATIONS
  // ============================================================
  const latestEvent = weightEventsAsc[weightEventsAsc.length - 1];
  const prevEvent = weightEventsAsc[weightEventsAsc.length - 2];

  const getWeight = (e: any) => e ? parseFloat(JSON.parse(e.data).amount) : 0;
  const latestWeight = getWeight(latestEvent);
  const prevWeight = getWeight(prevEvent);

  let currentPercentile = "—";
  let correctedPercentileStr = "";
  if (latestEvent) {
    const pVal = calculateInterpolatedPercentile(
      latestWeight,
      latestEvent.startTime,
      growthData
    );
    if (pVal) currentPercentile = pVal;

    if (prematurityActive && offsetMs > 0) {
      const correctedVal = calculateInterpolatedPercentile(
        latestWeight,
        latestEvent.startTime, // unshifted — correctedGrowthData already accounts for the offset
        correctedGrowthData
      );
      if (correctedVal) correctedPercentileStr = correctedVal;
    }
  }

  let weightDiffGrams = 0;
  let hasHistory = false;

  if (latestEvent && prevEvent) {
    hasHistory = true;
    const diffKg = latestWeight - prevWeight;
    weightDiffGrams = Math.round(diffKg * 1000);
  }

  let rateLabel = "Growth";
  let rateValue = "—";
  let rateColor: 'green' | 'red' | 'gray' = 'gray';

  const count = weightEventsAsc.length;
  if (count >= 2) {
    const lastIndex = count - 1;
    const pastIndex = Math.max(0, count - 5);

    const evtNow = weightEventsAsc[lastIndex];
    const evtPast = weightEventsAsc[pastIndex];

    const wNow = getWeight(evtNow);
    const wPast = getWeight(evtPast);

    const gainGrams = (wNow - wPast) * 1000;
    const timeDiffMs = new Date(evtNow.startTime).getTime() - new Date(evtPast.startTime).getTime();
    const daysDiff = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));

    if (daysDiff > 0) {
      const calculatedRate = Math.round(gainGrams / daysDiff);

      rateLabel = `Growth (over ${daysDiff}d)`;
      rateValue = `${calculatedRate > 0 ? '+' : ''}${calculatedRate} g/day`;
      rateColor = calculatedRate >= 0 ? 'green' : 'red';
    }
  }

  // ============================================================
  // CHART DATA PREPARATION
  // ============================================================
  const userPoints = weightEventsAsc.map(event => {
    const weight = parseFloat(JSON.parse(event.data).amount) || 0;
    const eventTime = new Date(event.startTime).getTime();

    // Actual age percentile
    const actualPercentile = calculateInterpolatedPercentile(
      weight,
      event.startTime,
      growthData
    );

    // Corrected age percentile (if prematurity is active)
    let correctedPercentile: string | null = null;
    if (prematurityActive && offsetMs > 0) {
      correctedPercentile = calculateInterpolatedPercentile(
        weight,
        event.startTime, // unshifted — correctedGrowthData is already shifted
        correctedGrowthData
      );
    }

    return {
      timestamp: eventTime,
      weight: weight,
      percentile: actualPercentile,
      correctedPercentile,
      isUser: true
    };
  });

  const referencePoints = growthData.map(row => ({
    timestamp: new Date(row.date).getTime(),
    p2: row.p2, p7: row.p7, p16: row.p16, p31: row.p31,
    p50: row.p50,
    p69: row.p69, p84: row.p84, p93: row.p93, p98: row.p98,
    isUser: false
  }));

  const correctedReferencePoints = prematurityActive && offsetMs > 0
    ? correctedGrowthData.map(row => ({
        timestamp: new Date(row.date).getTime(),
        p2: row.p2, p7: row.p7, p16: row.p16, p31: row.p31,
        p50: row.p50,
        p69: row.p69, p84: row.p84, p93: row.p93, p98: row.p98,
        isUser: false
      }))
    : referencePoints;

  // ============================================================
  // 5. INTELLIGENT MERGE
  // ============================================================
  const maxUserTime = userPoints.length > 0
    ? userPoints[userPoints.length - 1].timestamp
    : 0;
  const horizonTime = Math.max(Date.now(), maxUserTime);

  const getRelevantReferencePoints = (points: any[]) => {
    const firstFuturePoint = points.find(pt => pt.timestamp > horizonTime);
    const limit = firstFuturePoint ? firstFuturePoint.timestamp : horizonTime;
    return points.filter(pt => pt.timestamp <= limit);
  };

  const relevantActual = getRelevantReferencePoints(referencePoints);
  const relevantCorrected = getRelevantReferencePoints(correctedReferencePoints);

  const combinedActual = [...userPoints.filter(pt => !pt.correctedPercentile ? pt : { ...pt, ...pt }), ...relevantActual]
    .sort((a, b) => a.timestamp - b.timestamp);

  // For the actual-age chart: only the actual percentile
  const actualChartData = combinedActual.map(pt => ({
    timestamp: pt.timestamp,
    weight: pt.weight,
    ...Object.fromEntries(Object.keys(pt).filter(k => k.startsWith('p')).map(k => [k, (pt as any)[k]])),
    percentile: pt.percentile,
    isUser: pt.isUser
  }));

  // For the corrected-age chart: only the corrected percentile
  const correctedChartData = prematurityActive && offsetMs > 0
    ? (() => {
        const correctedUserPoints = userPoints.filter(pt => pt.correctedPercentile);
        const merged = [...correctedUserPoints, ...relevantCorrected]
          .sort((a, b) => a.timestamp - b.timestamp);
        return merged.map(pt => ({
          timestamp: pt.timestamp,
          weight: pt.weight,
          ...Object.fromEntries(Object.keys(pt).filter(k => k.startsWith('p')).map(k => [k, (pt as any)[k]])),
          percentile: pt.correctedPercentile,
          isUser: pt.isUser
        }));
      })()
    : actualChartData;

  // ============================================================
  // 6. PERCENTILE TREND DATA
  // ============================================================
  const percentileTrendData = userPoints
    .filter(pt => pt.percentile)
    .map(pt => {
      const safeLabel = pt.percentile || '';
      const numStr = safeLabel.replace(/[^0-9.]/g, '');
      const numVal = parseFloat(numStr);

      return {
        timestamp: pt.timestamp,
        value: isNaN(numVal) ? 50 : numVal,
        label: safeLabel
      };
    });

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">

      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">⚖️ Weight Log</h1>
      </header>

      {/* STATISTICS GRID */}
      <section className="grid grid-cols-2 gap-3 mb-6">

        <StatCard
          label="Current weight"
          value={latestWeight > 0 ? `${latestWeight} kg` : '—'}
          color="sky"
        />

        <StatCard
          label="Percentile"
          value={currentPercentile}
          color="blue"
        />

        <StatCard
          label={prematurityActive && correctedPercentileStr ? "Corrected percentile" : "Latest change"}
          value={prematurityActive && correctedPercentileStr
            ? correctedPercentileStr
            : !hasHistory ? "—" : `${weightDiffGrams > 0 ? '+' : ''}${weightDiffGrams} g`}
          color={prematurityActive && correctedPercentileStr ? "purple" : weightDiffGrams >= 0 ? 'green' : 'red'}
        />

        <StatCard
          label={rateLabel}
          value={rateValue}
          color={rateColor}
        />

      </section>

      {/* CHARTS */}
      <WeightChartSection
        actualData={actualChartData}
        correctedData={correctedChartData}
        prematurityActive={prematurityActive && offsetMs > 0}
      />

      {/* PERCENTILE TREND CHART */}
      <PercentileChart data={percentileTrendData} />

      {/* Weight List */}
      <section>
        <h2>All Entries</h2>
        <EventList events={weightEventsDesc} birthDate={birthDate} gender={gender} correctedOffsetMs={offsetMs} />
      </section>

    </main>
  );
}
