export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import WeightChartSection from '@/components/weight/WeightChartSection';
import StatCard from '@/components/ui/StatCard';
import { STATIC_GROWTH_DATA } from '@/data/growth_curve';
import { calculateInterpolatedPercentile } from '@/lib/growthUtils';
import EventList from '@/components/events/EventList';

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
  // STATISTICS CALCULATIONS
  // ============================================================
  
  // Basic Stats
  const latestEvent = weightEventsAsc[weightEventsAsc.length - 1];
  const prevEvent = weightEventsAsc[weightEventsAsc.length - 2];
  
  // Extract weights (helper to parse JSON safely)
  const getWeight = (e: any) => e ? parseFloat(JSON.parse(e.data).amount) : 0;
  const latestWeight = getWeight(latestEvent);
  const prevWeight = getWeight(prevEvent);

  // -- 1. Current Percentile Calculation --
  let currentPercentile = "—";
  if (latestEvent) {
    const pVal = calculateInterpolatedPercentile(
      latestWeight, 
      latestEvent.startTime, 
      STATIC_GROWTH_DATA
    );
    if (pVal) currentPercentile = pVal;
  }

  // -- 2. Latest Change (Immediate - Last 1 Step) --
  // Used for Card #3
  let weightDiffGrams = 0;
  let hasHistory = false;

  if (latestEvent && prevEvent) {
    hasHistory = true;
    const diffKg = latestWeight - prevWeight;
    weightDiffGrams = Math.round(diffKg * 1000);
  }

  // -- 3. Growth Rate (Windowed - Last 5 Steps) --
  // Used for Card #4
  let rateLabel = "Growth";
  let rateValue = "—";
  
  // 👇 FIX: Add ': any' here to prevent the TypeScript error
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
      
      // Changed colors to standard 'green'/'red' to match your other cards safely
      rateColor = calculatedRate >= 0 ? 'green' : 'red'; 
    }
  }

  // ============================================================
  // CHART DATA PREPARATION
  // ============================================================
  const userPoints = weightEventsAsc.map(event => {
    const weight = parseFloat(JSON.parse(event.data).amount) || 0;
    
    // Calculate percentile for this specific historical point
    const percentile = calculateInterpolatedPercentile(
      weight, 
      event.startTime, 
      STATIC_GROWTH_DATA
    );

    return {
      timestamp: new Date(event.startTime).getTime(),
      weight: weight,
      percentile: percentile,
      isUser: true
    };
  });

  const referencePoints = STATIC_GROWTH_DATA.map(row => ({
    timestamp: new Date(row.date).getTime(),
    p15: row.p15, p25: row.p25, p50: row.p50, p75: row.p75, p85: row.p85,
    isUser: false
  }));

  let shiftedReferencePoints: any[] = [];
  if (userPoints.length > 0 && referencePoints.length > 0) {
    const userStart = userPoints[0].timestamp; 
    const whoStart = referencePoints[0].timestamp; 
    const shiftAmount = whoStart - userStart; 
    shiftedReferencePoints = referencePoints.map(pt => ({ ...pt, timestamp: pt.timestamp - shiftAmount }));
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
  
  // 1. Corrected Data: Keep percentile for tooltip
  const combinedCorrected = [...userPoints, ...relevantCorrected]
    .sort((a, b) => a.timestamp - b.timestamp);

  // 2. Actual Data: Remove 'percentile' so tooltip doesn't show it
  const userPointsForActual = userPoints.map(pt => ({
    ...pt,
    percentile: undefined 
  }));

  const combinedActual = [...userPointsForActual, ...relevantActual]
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">⚖️ Weight Log</h1>
      </header>

      {/* STATISTICS GRID */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        
        {/* Card 1: Current Weight */}
        <StatCard 
          label="Current weight" 
          value={latestWeight > 0 ? `${latestWeight} kg` : '—'} 
          color="sky" 
        />
        
        {/* Card 2: Current Percentile */}
        <StatCard 
          label="Current percentile" 
          value={currentPercentile} 
          color="blue" 
        />

        {/* Card 3: Latest Change (Last entry vs 2nd Last) */}
        <StatCard 
          label="Latest change" 
          value={
            !hasHistory 
              ? "—" 
              : `${weightDiffGrams > 0 ? '+' : ''}${weightDiffGrams} g`
          } 
          color={weightDiffGrams >= 0 ? 'green' : 'red'} 
        />

        {/* Card 4: Growth Rate (Windowed Avg) */}
        <StatCard 
          label={rateLabel} 
          value={rateValue} 
          color={rateColor} 
        />

      </section>

      {/* CHARTS */}
      <WeightChartSection 
        correctedData={combinedCorrected} 
        actualData={combinedActual} 
      />

      {/* Weight List */}
      <section>
        <h2>All Entries</h2>
        <EventList events={weightEventsDesc} /> 
      </section>

    </main>
  );
}