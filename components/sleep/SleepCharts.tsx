'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; 

type ChartDataPoint = {
  label: string;
  value: number;
};

type ProbabilityPoint = {
  time: string; 
  percent: number; 
};

type TrendPoint = {
  date: string;
  total: number;
  night: number;
  nap: number;
};

type MeanTimingPoint = {
  date: string;
  meanBedtime: number;
  timestamp: number;
};

type MeanWakeupPoint = {
  date: string;
  meanWakeup: number;
  timestamp: number;
};

type MeanNightLengthPoint = {
  date: string;
  meanNightHours: number;
  timestamp: number;
};

type Props = {
  chartData: { date: string; nightHours: number; napHours: number }[]; 
  trendData: TrendPoint[];
  napDurationData: ChartDataPoint[];
  napStartTimeData: ChartDataPoint[];
  sleepProbabilityData: ProbabilityPoint[];
  dayStartHour?: number;
  bedtimeMeanTrend: MeanTimingPoint[];
  wakeupMeanTrend: MeanWakeupPoint[];
  nightLengthMeanTrend: MeanNightLengthPoint[];
};

type TimeRange = '1m' | '3m' | '6m' | '1y' | 'all';

// --- Custom Tooltip for Stacked Bar Chart ---
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = (data.nightHours + data.napHours).toFixed(1);
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl text-xs z-50">
        <p className="font-bold mb-2 text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-1">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-gray-900 dark:bg-gray-100" />
             <span className="text-gray-600 dark:text-gray-300">Total:</span>
             <span className="font-bold text-gray-900 dark:text-white ml-auto">{total}h</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
             <span className="text-gray-500 dark:text-gray-400">Nap:</span>
             <span className="font-medium text-gray-700 dark:text-gray-300 ml-auto">{data.napHours}h</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
             <span className="text-gray-500 dark:text-gray-400">Night:</span>
             <span className="font-medium text-gray-700 dark:text-gray-300 ml-auto">{data.nightHours}h</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- Time formatter helper for Y-axis ticks (decimal hours → HH:MM) ---
const formatHourTick = (val: number) => {
  const h = val >= 24 ? val - 24 : val;
  const m = Math.round((h - Math.floor(h)) * 60);
  return `${Math.floor(h).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// --- Time formatter for tooltip (decimal hours → HH:MM) ---
const formatTimeForTooltip = (val: number) => {
  const h = val >= 24 ? val - 24 : val;
  const m = Math.round((h - Math.floor(h)) * 60);
  return `${Math.floor(h).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Compute Y-axis domain with margin for a set of numeric values
const domainWithMargin = (values: (number | null)[], marginPercent: number = 0.08): [number, number] => {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return [0, 1];
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  return [min - range * marginPercent, max + range * marginPercent];
};

// --- Time range button component ---
const btnClass = (active: boolean) =>
  `px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
    active
      ? 'bg-slate-600 text-white dark:bg-slate-500'
      : 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
  }`;

// --- Compute cutoff timestamp for a time range ---
const getCutoffMs = (range: TimeRange): number | null => {
  if (range === 'all') return null;
  const now = Date.now();
  const ms = {
    '1m': 30 * 24 * 60 * 60 * 1000,
    '3m': 90 * 24 * 60 * 60 * 1000,
    '6m': 180 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  }[range];
  return now - ms;
};

export default function SleepCharts({ 
  chartData, 
  trendData, 
  napDurationData, 
  napStartTimeData, 
  sleepProbabilityData, 
  dayStartHour,
  bedtimeMeanTrend,
  wakeupMeanTrend,
  nightLengthMeanTrend,
}: Props) {

  // Shared time range state
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Format the time boundary label dynamically
  const hour = dayStartHour ?? 6;
  const displayHour = hour > 12 ? hour - 12 : hour;
  const amPm = hour >= 12 ? 'pm' : 'am';
  const headerTimeStr = `${displayHour}.00${amPm} - ${displayHour}.00${amPm}`;

  // Filter data by selected time range
  const cutoffMs = getCutoffMs(timeRange);

  const filteredBedtime = useMemo(() => 
    cutoffMs ? bedtimeMeanTrend.filter(d => d.timestamp >= cutoffMs) : bedtimeMeanTrend,
    [bedtimeMeanTrend, cutoffMs]
  );

  const filteredWakeup = useMemo(() => 
    cutoffMs ? wakeupMeanTrend.filter(d => d.timestamp >= cutoffMs) : wakeupMeanTrend,
    [wakeupMeanTrend, cutoffMs]
  );

  const filteredNightLength = useMemo(() => 
    cutoffMs ? nightLengthMeanTrend.filter(d => d.timestamp >= cutoffMs) : nightLengthMeanTrend,
    [nightLengthMeanTrend, cutoffMs]
  );

  // Y-axis domains with margin
  const bedtimeDomain = useMemo(() => 
    domainWithMargin(filteredBedtime.map(d => d.meanBedtime), 0.08),
    [filteredBedtime]
  );

  const wakeupDomain = useMemo(() => 
    domainWithMargin(filteredWakeup.map(d => d.meanWakeup), 0.08),
    [filteredWakeup]
  );

  const nightLengthDomain = useMemo(() => 
    domainWithMargin(filteredNightLength.map(d => d.meanNightHours), 0.08),
    [filteredNightLength]
  );

  // Time range buttons row
  const rangeButtons = (
    <div className="flex justify-center gap-1.5 flex-wrap">
      <button onClick={() => setTimeRange('1m')} className={btnClass(timeRange === '1m')}>1 Mo</button>
      <button onClick={() => setTimeRange('3m')} className={btnClass(timeRange === '3m')}>3 Mo</button>
      <button onClick={() => setTimeRange('6m')} className={btnClass(timeRange === '6m')}>6 Mo</button>
      <button onClick={() => setTimeRange('1y')} className={btnClass(timeRange === '1y')}>1 Yr</button>
      <button onClick={() => setTimeRange('all')} className={btnClass(timeRange === 'all')}>All</button>
    </div>
  );

  return (
    <section className="space-y-6 mb-4">
      
      {/* 1. Sleep Probability */}
      <ChartCard title={`Sleep Probability (${headerTimeStr} Pattern)`}>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepProbabilityData} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={17} />
              <YAxis tick={{ fontSize: 12 }} unit="%" width={35} domain={[20, 100]} ticks={[20, 40, 60, 80, 100]} allowDataOverflow={true} />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Chance']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="percent" fill="#34a0cf" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 2. Daily Sleep Chart (STACKED) */}
      <ChartCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Sleep per Day <span className="text-sm font-normal text-gray-500">({headerTimeStr})</span>
          </h3>
          
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#c084fc]" /> 
              <span>Nap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" /> 
              <span>Night</span>
            </div>
          </div>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={30} unit="h" />
              
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'transparent' }} />
              
              <Bar dataKey="nightHours" name="Night" stackId="a" fill="#3b82f6" />
              <Bar dataKey="napHours" name="Nap" stackId="a" fill="#c084fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 3. Sleep Trends Line Chart (Last 30 Days) */}
      <ChartCard>
        <div className="flex flex-wrap items-center justify-between mb-2 gap-y-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mr-2">
            Sleep Trends <span className="text-sm font-normal text-gray-500">({headerTimeStr})</span>
          </h3>
          
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: '16px', height: '4px', backgroundColor: '#374151' }} />
              <span>Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: '16px', height: '2px', backgroundColor: '#c084fc' }} />
              <span>Nap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: '16px', height: '2px', backgroundColor: '#3b82f6' }} />
              <span>Night</span>
            </div>
          </div>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 12 }} width={30} unit="h" domain={[0, 'auto']} />
              
              <Tooltip 
                 contentStyle={{ borderRadius: '8px' }}
                 itemStyle={{ fontSize: '12px', padding: 0 }}
              />
              
              <Line type="monotone" dataKey="total" name="Total" stroke="#374151" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="night" name="Night" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="nap" name="Nap" stroke="#c084fc" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 4. Mean Bedtime (Rolling Average) */}
      <ChartCard title="Bedtime (Rolling Mean)">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredBedtime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                width={38}
                domain={bedtimeDomain}
                tickFormatter={formatHourTick}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', padding: 0 }}
                labelFormatter={(label) => label as string}
                formatter={(value: any) => [formatTimeForTooltip(Number(value)), 'Bedtime']}
              />
              <Line type="monotone" dataKey="meanBedtime" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {rangeButtons}
      </ChartCard>

      {/* 5. Mean Wake-up Time (Rolling Average) */}
      <ChartCard title="Wake-up Time (Rolling Mean)">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredWakeup}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                width={38}
                domain={wakeupDomain}
                tickFormatter={formatHourTick}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', padding: 0 }}
                labelFormatter={(label) => label as string}
                formatter={(value: any) => [formatTimeForTooltip(Number(value)), 'Wake-up']}
              />
              <Line type="monotone" dataKey="meanWakeup" stroke="#10b981" strokeWidth={2} dot={false} connectNulls activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {rangeButtons}
      </ChartCard>

      {/* 6. Mean Night Sleep Length (Rolling Average) */}
      <ChartCard title="Night Sleep Length (Rolling Mean)">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredNightLength}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                width={38}
                domain={nightLengthDomain}
                tickCount={5}
                tickFormatter={(val: number) => `${val.toFixed(1)}h`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', padding: 0 }}
                labelFormatter={(label) => label as string}
                formatter={(value: any) => [`${Number(value).toFixed(1)}h`, 'Night sleep']}
              />
              <Line type="monotone" dataKey="meanNightHours" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {rangeButtons}
      </ChartCard>

    </section>
  );
}