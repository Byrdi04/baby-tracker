'use client';

import { useState } from 'react';
import WeightCharts, { TimeRange } from '@/app/weight/WeightCharts';

type Props = {
  correctedData: any[];
  actualData: any[];
  prematurityActive?: boolean;
};

export default function WeightChartSection({ correctedData, actualData, prematurityActive = false }: Props) {
  const [globalRange, setGlobalRange] = useState<TimeRange>('all');

  return (
    <>
      {prematurityActive ? (
        <>
          {/* CHART 1: Corrected Age */}
          <WeightCharts
            chartData={correctedData}
            title="Growth Chart (Corrected Age)"
            controlledRange={globalRange}
            onRangeChange={setGlobalRange}
          />

          {/* CHART 2: Actual Age */}
          <WeightCharts
            chartData={actualData}
            title="Growth Chart (Actual Age)"
            controlledRange={globalRange}
            onRangeChange={setGlobalRange}
          />
        </>
      ) : (
        <>
          {/* Single chart when prematurity is not active */}
          <WeightCharts
            chartData={actualData}
            title="Growth Chart"
            controlledRange={globalRange}
            onRangeChange={setGlobalRange}
          />
        </>
      )}
    </>
  );
}
