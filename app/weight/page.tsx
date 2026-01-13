export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import WeightChartSection from '@/components/weight/WeightChartSection';
import StatCard from '@/components/ui/StatCard';
import { STATIC_GROWTH_DATA } from '@/data/growth_curve';
import { calculateInterpolatedPercentile } from '@/lib/growthUtils'; // 👈 Import utility
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
  const firstEvent = weightEventsAsc[0];
  const latestEvent = weightEventsAsc[weightEventsAsc.length - 1];
  const prevEvent = weightEventsAsc[weightEventsAsc.length - 2];

  const firstWeight = firstEvent ? parseFloat(JSON.parse(firstEvent.data).amount) : 0;
  const latestWeight = latestEvent ? parseFloat(JSON.parse(latestEvent.data).amount) : 0;
  const prevWeight = prevEvent ? parseFloat(JSON.parse(prevEvent.data).amount) : 0;

  const totalGain = latestWeight - firstWeight;

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

  // -- 2. Recent Change (g and g/day) Calculation --
  let changeString = "—";
  let changeColor = "gray"; // default

    // 1. Create variables "outside" so the Card can see them later
  let weightDiffGrams = 0;
  let rate = 0;
  let hasHistory = false; // A flag to know if we should show "+" or "—"

  // 2. Do the math "inside"
  if (latestEvent && prevEvent) {
    hasHistory = true;
    const weightDiffKg = latestWeight - prevWeight;
    
    // Update the outer variables
    weightDiffGrams = Math.round(weightDiffKg * 1000);
    
    const timeDiffMs = new Date(latestEvent.startTime).getTime() - new Date(prevEvent.startTime).getTime();
    const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
    
    rate = timeDiffDays > 0 ? Math.round(weightDiffGrams / timeDiffDays) : 0;
  }


  // ============================================================
  // CHART DATA PREPARATION (Existing Logic)
  // ============================================================
  const userPoints = weightEventsAsc.map(event => ({
    timestamp: new Date(event.startTime).getTime(),
    weight: parseFloat(JSON.parse(event.data).amount) || 0,
    isUser: true
  }));

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
  // 5. INTELLIGENT MERGE (Fix for hanging dots)
  // ============================================================
  
  // A. Determine the "Horizon" 
  // (The later of: Current Real Time OR The Last Weight Entry)
  const maxUserTime = userPoints.length > 0 
    ? userPoints[userPoints.length - 1].timestamp 
    : 0;
    
  const horizonTime = Math.max(Date.now(), maxUserTime);

  // B. Helper: Include WHO points up to the first one AFTER the horizon
  // This ensures the line continues past the dot to the next "Month" marker.
  const getRelevantReferencePoints = (points: any[]) => {
    // 1. Find the first point that is strictly AFTER our horizon
    const firstFuturePoint = points.find(pt => pt.timestamp > horizonTime);
    
    // 2. Determine the cutoff limit
    // If we found a future point (e.g. Next Month), use that.
    // If we didn't (end of chart), just use the horizon.
    const limit = firstFuturePoint ? firstFuturePoint.timestamp : horizonTime;

    return points.filter(pt => pt.timestamp <= limit);
  };

  // C. Filter Reference Data
  const relevantCorrected = getRelevantReferencePoints(referencePoints);
  const relevantActual = getRelevantReferencePoints(shiftedReferencePoints);
  
  // D. Merge & Sort
  const combinedCorrected = [...userPoints, ...relevantCorrected]
    .sort((a, b) => a.timestamp - b.timestamp);

  const combinedActual = [...userPoints, ...relevantActual]
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">⚖️ Weight Log</h1>
      </header>

      {/* STATISTICS GRID: Now 2x2 */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        
        {/* Card 1: Current Weight */}
        <StatCard 
          label="Current Weight" 
          value={latestWeight > 0 ? `${latestWeight} kg` : '—'} 
          color="sky" 
        />
        
        {/* Card 2: Current Percentile (New) */}
        <StatCard 
          label="Current Percentile" 
          value={currentPercentile} 
          color="blue" 
        />

        {/* 3 Absolute Change Card */}
        <StatCard 
          label="Lastest Change" 
          // Logic: If no history, show "—". If history, show number with sign.
          value={
            !hasHistory 
              ? "—" 
              : `${weightDiffGrams > 0 ? '+' : ''}${weightDiffGrams} g`
          } 
          color={weightDiffGrams >= 0 ? 'green' : 'red'} 
        />

        {/* 4 Relative Change Card */}
        <StatCard 
          label="Growth Rate" 
          value={
             !hasHistory 
               ? "—" 
               : `${weightDiffGrams > 0 ? '+' : ''}${rate} g/day`
          } 
          color={weightDiffGrams >= 0 ? 'emerald' : 'fuchsia'} 
        />

        {/* Card 4: Total Gain 
        <StatCard 
          label="Total Gain" 
          value={`${totalGain > 0 ? '+' : ''}${totalGain.toFixed(2)} kg`} 
          color={totalGain >= 0 ? 'green' : 'red'} 
        />*/}

      </section>

      {/* CHARTs */}
      <WeightChartSection 
        correctedData={combinedCorrected} 
        actualData={combinedActual} 
      />

      {/* Weight List Component */}
      <section>
        <h2>All Entries</h2>
        <EventList events={weightEventsDesc} /> 
      </section>

    </main>
  );
}