// components/weight/PercentileChart.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import ChartCard from '@/components/ui/ChartCard';

export type TimeRange = '1m' | '3m' | '6m' | '1y' | 'all';

type TrendPoint = {
  timestamp: number;
  value: number;
  label: string;
};

type Props = {
  data: TrendPoint[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dateStr = new Date(label).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
    
    const data = payload[0].payload;

    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-gray-700 dark:text-gray-200 mb-1 border-b border-gray-100 dark:border-gray-800 pb-1">
          {dateStr}
        </p>
        <div className="flex items-center justify-between gap-4 mt-2">
          <span className="text-gray-500 font-medium">Percentile:</span>
          <span className="font-bold text-blue-500 text-sm">
            {data.label}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function PercentileChart({ data }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const dotRadius = useMemo(() => {
    switch (timeRange) {
      case '1m': return 3;
      case '3m': return 2.5;
      case '6m': return 2;
      case '1y': return 1;
      case 'all': return 1.5;
      default: return 3;
    }
  }, [timeRange]);

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

  const maxDomain = useMemo(() => {
    let maxUserTime = 0;
    data.forEach(pt => {
      if (pt.timestamp > maxUserTime) {
        maxUserTime = pt.timestamp;
      }
    });

    const horizon = Math.max(Date.now(), maxUserTime);
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    return horizon + threeDaysMs;
  }, [data]);

  // 👇 NEW 1: Filter data to only look at what's inside the current time range
  const filteredData = useMemo(() => {
    if (typeof minDomain !== 'number') return data;
    return data.filter(pt => pt.timestamp >= minDomain);
  }, [data, minDomain]);

  // 👇 NEW 2: Dynamically calculate the Y-axis limits with a 10% padding
  const yDomain = useMemo(() => {
    if (filteredData.length === 0) return [0, 100];
    
    const minVal = Math.min(...filteredData.map(d => d.value));
    const maxVal = Math.max(...filteredData.map(d => d.value));
    
    // Add 10% padding below and above, snapping to the nearest 10
    let lower = Math.max(0, Math.floor(minVal / 10) * 10 - 10);
    let upper = Math.min(100, Math.ceil(maxVal / 10) * 10 + 10);
    
    // Safety check if they only have 1 data point
    if (lower === upper) {
      lower = Math.max(0, lower - 10);
      upper = Math.min(100, upper + 10);
    }
    
    return [lower, upper];
  }, [filteredData]);

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
      <ChartCard title="Percentile Trend (Actual Age)">
        
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              
              <XAxis 
                dataKey="timestamp" 
                type="number" 
                domain={[minDomain, maxDomain]} 
                allowDataOverflow={true} 
                tickFormatter={dateFormatter}
                tick={{ fontSize: 11 }} 
                interval={timeRange === '1m' ? 0 : 'preserveStartEnd'}
              />
              
              {/* 👇 UPDATED YAxis to use dynamic domain and remove hardcoded ticks */}
              <YAxis 
                domain={yDomain} 
                allowDecimals={false}
                tick={{ fontSize: 11 }} 
                unit="%"
              />
              
              <Tooltip content={<CustomTooltip />} />

              {/* Reference lines will automatically hide if outside the dynamic yDomain */}
              <ReferenceLine y={85} stroke="#018221" strokeOpacity={0.2} strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="#01ca18" strokeOpacity={0.2} strokeDasharray="3 3" />
              <ReferenceLine y={15} stroke="#d7c203" strokeOpacity={0.2} strokeDasharray="3 3" />

              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4a78d5ff" 
                strokeWidth={2}
                dot={{ 
                  fill: '#ffffffff', 
                  stroke: '#4a78d5ff', 
                  strokeWidth: 2, 
                  r: dotRadius 
                }}
                activeDot={{ r: dotRadius + 2, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          <button onClick={() => setTimeRange('1m')} className={btnClass('1m')}>1 Mo</button>
          <button onClick={() => setTimeRange('3m')} className={btnClass('3m')}>3 Mo</button>
          <button onClick={() => setTimeRange('6m')} className={btnClass('6m')}>6 Mo</button>
          <button onClick={() => setTimeRange('1y')} className={btnClass('1y')}>1 Yr</button>
          <button onClick={() => setTimeRange('all')} className={btnClass('all')}>All</button>
        </div>

      </ChartCard>
    </section>
  );
}