'use client';

import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; 
import { useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';

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

type Props = {
  chartData: { date: string; nightHours: number; napHours: number }[]; 
  trendData: TrendPoint[];
  napDurationData: ChartDataPoint[];
  napStartTimeData: ChartDataPoint[];
  sleepProbabilityData: ProbabilityPoint[];
  wakeupsData: { date: number; wakeups: number }[];
  medianWakeupsLast14: number;            // NEW
  longestStretchMinutesLast14: number;
};

const formatMinutes = (mins: number) => {
  if (!mins || mins <= 0) return '–';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

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

// --- Custom Tick for Histogram ---
const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#9CA3AF" transform="rotate(-90)" fontSize={10}>
          {payload.value}
        </text>
      </g>
    );
  };

export default function SleepCharts({ 
  chartData, 
  trendData, 
  napDurationData, 
  napStartTimeData, 
  sleepProbabilityData, 
  wakeupsData,
  medianWakeupsLast14,           // ← add
  longestStretchMinutesLast14
}: Props) {
    useEffect(() => {
    console.log('Wakeups Data:', wakeupsData);
  }, [wakeupsData]);

  // Add a string label for the X-axis (equal spacing, category axis)
  const wakeupsChartData = wakeupsData.map((d) => ({
    ...d,
    // e.g. "Mon 3 Feb"
    label: new Date(d.date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
  }));

  return (
    <section className="space-y-6 mb-4">
      
      {/* 1. Sleep Probability */}
      <ChartCard title="Sleep Probability (24h Pattern)">
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
            Sleep per Day <span className="text-sm font-normal text-gray-500">(Last 7 Days)</span>
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
            {/* 3. NEW: Sleep Trends Line Chart (Last 30 Days) */}
      <ChartCard>
        <div className="flex flex-wrap items-center justify-between mb-2 gap-y-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mr-2">
            Sleep Trends
          </h3>
          
          {/* Custom Legend */}
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            
            {/* Total (Thick Gray Line) */}
            <div className="flex items-center gap-1.5">
              <div 
                className="rounded-full" 
                style={{ width: '16px', height: '4px', backgroundColor: '#374151' }} 
              />
              <span>Total</span>
            </div>

            {/* Nap (Thin Purple Line) */}
            <div className="flex items-center gap-1.5">
              <div 
                className="rounded-full" 
                style={{ width: '16px', height: '2px', backgroundColor: '#c084fc' }} 
              />
              <span>Nap</span>
            </div>

            {/* Night (Thin Blue Line) */}
            <div className="flex items-center gap-1.5">
              <div 
                className="rounded-full" 
                style={{ width: '16px', height: '2px', backgroundColor: '#3b82f6' }} 
              />
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

      {/* 5. Night Wake-ups Line Chart (All Time) */}
      <ChartCard>
        {/* NEW: Stats row above the chart */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            // Adjust prop names to match your StatCard implementation
            label="Night wake-ups"
            value={medianWakeupsLast14.toFixed(0)}
            color="emerald"
          />
          <StatCard
            label="Longest sleep"
            value={formatMinutes(longestStretchMinutesLast14)}
            color="green"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between mb-2 gap-y-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mr-2">
            Night Wake-ups
          </h3>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wakeupsChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              
              {wakeupsChartData.length === 0 ? (
                <text x={20} y={20} fill="#9CA3AF">No wake-up data available</text>
              ) : (
                <>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"  // show first & last, auto-thin the rest
                    minTickGap={12}              // pixel gap between ticks before thinning more
                  />
                  
                  <YAxis tick={{ fontSize: 12 }} width={30} />
                  
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', padding: 0 }}
                    // label is already a string like "Mon 3 Feb"
                    labelFormatter={(label) => label as string}
                    formatter={(value) => [`${value} wake-ups`, 'Wake-ups']}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="wakeups"        // still fine, this field exists on wakeupsChartData
                    stroke="#0d9488" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

    </section>
  );
}