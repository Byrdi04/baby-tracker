export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import WeightChartSection from '@/components/weight/WeightChartSection';
import StatCard from '@/components/ui/StatCard';
import { STATIC_GROWTH_DATA } from '@/data/growth_curve';
import { calculateInterpolatedPercentile } from '@/lib/growthUtils';
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

  // ============================================================
  // CALCULATE TIME SHIFT FOR ACTUAL AGE PERCENTILES
  // ============================================================
  const userTimes = weightEventsAsc.map(e => new Date(e.startTime).getTime());
  const userStart = userTimes.length > 0 ? userTimes[0] : 0;
  const whoStart = STATIC_GROWTH_DATA.length > 0 ? new Date(STATIC_GROWTH_DATA[0].date).getTime() : 0;
  
  const shiftAmount = (userStart > 0 && whoStart > 0) ? whoStart - userStart : 0;

  // ============================================================
  // STATISTICS CALCULATIONS
  // ============================================================
  const latestEvent = weightEventsAsc[weightEventsAsc.length - 1];
  const prevEvent = weightEventsAsc[weightEventsAsc.length - 2];
  
  const getWeight = (e: any) => e ? parseFloat(JSON.parse(e.data).amount) : 0;
  const latestWeight = getWeight(latestEvent);
  const prevWeight = getWeight(prevEvent);

  let currentPercentile = "—";
  if (latestEvent) {
    const latestTime = new Date(latestEvent.startTime).getTime();
    const actualQueryTime = new Date(latestTime + shiftAmount).toISOString();
    
    const pVal = calculateInterpolatedPercentile(
      latestWeight, 
      actualQueryTime, 
      STATIC_GROWTH_DATA
    );
    if (pVal) currentPercentile = pVal;
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
  let rateColor: any = "gray"; 

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
    
    const correctedPercentile = calculateInterpolatedPercentile(
      weight, 
      event.startTime, 
      STATIC_GROWTH_DATA
    );

    const actualQueryTime = new Date(eventTime + shiftAmount).toISOString();
    const actualPercentile = calculateInterpolatedPercentile(
      weight, 
      actualQueryTime, 
      STATIC_GROWTH_DATA
    );

    return {
      timestamp: eventTime,
      weight: weight,
      percentile: correctedPercentile,     
      actualPercentile: actualPercentile,  
      isUser: true
    };
  });

  const referencePoints = STATIC_GROWTH_DATA.map(row => ({
    timestamp: new Date(row.date).getTime(),
    // 👇 ADDED THE NEW LOWER PERCENTILE COLUMNS HERE
    p01: row.p01, p1: row.p1, p3: row.p3, p5: row.p5, p10: row.p10,
    p15: row.p15, p25: row.p25, p50: row.p50, p75: row.p75, p85: row.p85,
    isUser: false
  }));

  let shiftedReferencePoints: any[] = [];
  if (userPoints.length > 0 && referencePoints.length > 0) {
    shiftedReferencePoints = referencePoints.map(pt => ({ 
      ...pt, 
      timestamp: pt.timestamp - shiftAmount 
    }));
  } else {
    shiftedReferencePoints = referencePoints;
  }

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

  const relevantCorrected = getRelevantReferencePoints(referencePoints);
  const relevantActual = getRelevantReferencePoints(shiftedReferencePoints);
  
  const combinedCorrected = [...userPoints, ...relevantCorrected]
    .sort((a, b) => a.timestamp - b.timestamp);

  const userPointsForActual = userPoints.map(pt => ({
    ...pt,
    percentile: pt.actualPercentile 
  }));

  const combinedActual = [...userPointsForActual, ...relevantActual]
    .sort((a, b) => a.timestamp - b.timestamp);

  // ============================================================
  // 6. PERCENTILE TREND DATA
  // ============================================================
  const percentileTrendData = userPoints
    .filter(pt => pt.actualPercentile) 
    .map(pt => {
      // 👇 Create a guaranteed string fallback to satisfy TypeScript
      const safeLabel = pt.actualPercentile || '';
      
      const numStr = safeLabel.replace(/[^0-9.]/g, ''); 
      const numVal = parseFloat(numStr);
      
      return {
        timestamp: pt.timestamp,
        value: isNaN(numVal) ? 50 : numVal, 
        label: safeLabel // 👇 Now TypeScript knows this is strictly a string!
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
          label="Current percentile" 
          value={currentPercentile} 
          color="blue" 
        />

        <StatCard 
          label="Latest change" 
          value={
            !hasHistory 
              ? "—" 
              : `${weightDiffGrams > 0 ? '+' : ''}${weightDiffGrams} g`
          } 
          color={weightDiffGrams >= 0 ? 'green' : 'red'} 
        />

        <StatCard 
          label={rateLabel} 
          value={rateValue} 
          color={rateColor} 
        />

      </section>

      {/* CHARTS */}
      <WeightChartSection 
        actualData={combinedActual} 
        correctedData={combinedCorrected} 
      />

      {/* PERCENTILE TREND CHART */}
      <PercentileChart data={percentileTrendData} />

      {/* Weight List */}
      <section>
        <h2>All Entries</h2>
        <EventList events={weightEventsDesc} /> 
      </section>

    </main>
  );
}