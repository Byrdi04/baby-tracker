'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/ui/ChartCard';

// 1. Define the TimeRange type so we can share it
export type TimeRange = '1m' | '3m' | '6m' | '1y' | 'all';

type CombinedDataPoint = {
  timestamp: number;
  weight?: number;
  p15?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p85?: number;
  isUser?: boolean;
};

type Props = {
  chartData: CombinedDataPoint[];
  title?: string;
  // 2. Add optional props for external control
  controlledRange?: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  // ... (Keep existing tooltip logic exactly as is) ...
  if (active && payload && payload.length) {
    const dateStr = new Date(label).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
    const sortedPayload = [...payload].sort((a: any, b: any) => {
      if (a.name === 'weight') return -1;
      return 1;
    });
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">
          {dateStr}
        </p>
        <div className="flex flex-col gap-1">
          {sortedPayload.map((entry: any, index: number) => {
            const name = entry.name === 'weight' ? 'Baby' : entry.name.toUpperCase();
            const isBaby = entry.name === 'weight';
            return (
              <div key={index} className={`flex items-center justify-between gap-4 ${isBaby ? 'font-bold text-sm' : 'text-gray-500'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{name}</span>
                </div>
                <span>{Number(entry.value).toFixed(2)} kg</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function WeightCharts({ 
  chartData, 
  title = "Growth Chart",
  controlledRange,   // New prop
  onRangeChange      // New prop
}: Props) {
  
  // 3. Internal state (fallback if no parent controls this)
  const [internalRange, setInternalRange] = useState<TimeRange>('all');

  // 4. Determine which range to use: The parent's or the internal one?
  const timeRange = controlledRange ?? internalRange;

  // 👇 NEW: Determine dot size based on zoom level
  const dotRadius = useMemo(() => {
    switch (timeRange) {
      case '1m': return 3;   // Largest dots
      case '3m': return 2.5;
      case '6m': return 2;
      case '1y': return 1;
      case 'all': return 1.5; // Smallest dots to prevent crowding
      default: return 3;
    }
  }, [timeRange]);

  // 5. Handle clicks: Notify parent if possible, otherwise set internal state
  const handleRangeClick = (range: TimeRange) => {
    if (onRangeChange) {
      onRangeChange(range);
    } else {
      setInternalRange(range);
    }
  };

  // ... (Keep existing minDomain, filteredData, yDomain, yTicks logic exactly as is) ...
  // JUST COPY PASTE YOUR EXISTING MEMO LOGIC HERE
  const minDomain = useMemo(() => {
    if (timeRange === 'all') return 'dataMin';
    const cutoff = new Date();
    switch (timeRange) {
      case '1m': cutoff.setMonth(cutoff.getMonth() - 1); break;
      case '3m': cutoff.setMonth(cutoff.getMonth() - 3); break;
      case '6m': cutoff.setMonth(cutoff.getMonth() - 6); break;
      case '1y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
    }
    return cutoff.getTime();
  }, [timeRange]);

  // 2. (NEW) CALCULATE X-AXIS END (Horizon + 3 Days)
  const maxDomain = useMemo(() => {
    // A. Find the latest "Real" moment (User Entry or Right Now)
    // We explicitly ignore the future WHO points we added for line drawing.
    const now = Date.now();
    let maxUserTime = 0;

    chartData.forEach(pt => {
      // We look at 'isUser' points to find the last weight log
      if (pt.isUser && pt.timestamp > maxUserTime) {
        maxUserTime = pt.timestamp;
      }
    });

    const horizon = Math.max(now, maxUserTime);

    // B. Add exactly 3 Days in milliseconds
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    return horizon + threeDaysMs;
  }, [chartData]);


  const filteredData = useMemo(() => {
    if (typeof minDomain !== 'number') return chartData;
    return chartData.filter(pt => pt.timestamp >= minDomain);
  }, [chartData, minDomain]);

  const yDomain = useMemo(() => {
    if (filteredData.length === 0) return [0, 10];
    let min = Infinity;
    let max = -Infinity;
    filteredData.forEach(pt => {
      if (pt.weight !== undefined) {
        min = Math.min(min, pt.weight);
        max = Math.max(max, pt.weight);
      }
      if (pt.p15 !== undefined) min = Math.min(min, pt.p15);
      if (pt.p85 !== undefined) max = Math.max(max, pt.p85);
    });
    if (min === Infinity) return [0, 10];
    return [min - 0.2, max + 0.2];
  }, [filteredData]);

  const yTicks = useMemo(() => {
    const [minVal, maxVal] = yDomain;
    if (typeof minVal !== 'number' || typeof maxVal !== 'number') return undefined;
    const ticks = [];
    let current = Math.floor(minVal / 2) * 2;
    if (current < 0) current = 0;
    while (current <= maxVal + 1) { 
      ticks.push(current);
      current += 2;
    }
    return ticks;
  }, [yDomain]);
  // ... (End of Memo logic) ...

  const dateFormatter = (tickItem: number) => {
    return new Date(tickItem).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const btnClass = (range: string) => 
    `px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
      timeRange === range 
        ? 'bg-slate-600 text-white dark:bg-slate-500' 
        : 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`;

  return (
    <section className="mb-6">
      <ChartCard title={title}>
        
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>  
              <XAxis 
                dataKey="timestamp" 
                type="number" 
                domain={[minDomain, maxDomain]} 
                allowDataOverflow={true} 
                tickFormatter={dateFormatter}
                tick={{ fontSize: 11 }} 
                interval={timeRange === '1m' ? 0 : 'preserveStartEnd'}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                unit=" kg" 
                domain={yDomain} 
                ticks={yTicks}   
                allowDataOverflow={true}
                tickFormatter={(value) => value.toString()}
                type="number"
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line type="monotone" dataKey="p85" stroke="#018221ff" strokeWidth={1.5} strokeDasharray="6 6" dot={false} connectNulls />
              <Line type="monotone" dataKey="p15" stroke="#d7c203ff" strokeWidth={1.5} strokeDasharray="6 6" dot={false} connectNulls />
              <Line type="monotone" dataKey="p75" stroke="#029f05ff" strokeWidth={1.5} strokeDasharray="6 6" dot={false} connectNulls />
              <Line type="monotone" dataKey="p25" stroke="#97b200ff" strokeWidth={1.5} strokeDasharray="6 6" dot={false} connectNulls />
              <Line type="monotone" dataKey="p50" stroke="#01ca18ff" strokeWidth={1.5} strokeDasharray="6 6" dot={false} connectNulls />

              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3e6283ff" 
                strokeWidth={0}
                dot={{ 
                  fill: '#2f86f8d6', 
                  stroke: '#51a8faff', 
                  strokeWidth: 1, 
                  r: dotRadius 
                }}
                // 👇 Make the hover effect slightly larger than the normal dot
                activeDot={{ 
                  r: dotRadius + 1.5, 
                  strokeWidth: 0 
                }}
                connectNulls 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {/* 6. Use handleRangeClick instead of setTimeRange */}
          <button onClick={() => handleRangeClick('1m')} className={btnClass('1m')}>1 Mo</button>
          <button onClick={() => handleRangeClick('3m')} className={btnClass('3m')}>3 Mo</button>
          <button onClick={() => handleRangeClick('6m')} className={btnClass('6m')}>6 Mo</button>
          <button onClick={() => handleRangeClick('1y')} className={btnClass('1y')}>1 Yr</button>
          <button onClick={() => handleRangeClick('all')} className={btnClass('all')}>All</button>
        </div>

      </ChartCard>
    </section>
  );
}