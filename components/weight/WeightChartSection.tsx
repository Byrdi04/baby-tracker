'use client';

import { useState } from 'react';
import WeightCharts, { TimeRange } from '@/app/weight/WeightCharts';

type Props = {
  correctedData: any[];
  actualData: any[];
};

export default function WeightChartSection({ correctedData, actualData }: Props) {
  // This state controls BOTH charts
  const [globalRange, setGlobalRange] = useState<TimeRange>('all');

  return (
    <>
      {/* CHART 1: Corrected Age */}
      <WeightCharts 
        chartData={correctedData} 
        title="Growth Chart (Corrected Age)" 
        controlledRange={globalRange} // Pass the state down
        onRangeChange={setGlobalRange} // Pass the updater down
      />

      {/* CHART 2: Actual Age */}
      <WeightCharts 
        chartData={actualData} 
        title="Growth Chart (Actual Age)" 
        controlledRange={globalRange} // Pass the SAME state down
        onRangeChange={setGlobalRange} // Pass the SAME updater down
      />
    </>
  );
}