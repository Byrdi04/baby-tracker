'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; 

type ChartDataPoint = {
  label: string;
  value: number;
};

type ProbabilityPoint = {
  time: string; 
  percent: number; 
};

// 1. Update Props Type
type Props = {
  // changed from 'hours' to split values
  chartData: { date: string; nightHours: number; napHours: number }[]; 
  napDurationData: ChartDataPoint[];
  napStartTimeData: ChartDataPoint[];
  sleepProbabilityData: ProbabilityPoint[];
};

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

export default function SleepCharts({ chartData, napDurationData, napStartTimeData, sleepProbabilityData }: Props) {
  return (
    <section className="space-y-6 mb-4">
      
      {/* 1. Sleep Probability */}
      <ChartCard title="Sleep Probability (24h Pattern)">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepProbabilityData} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={17} />
              <YAxis tick={{ fontSize: 12 }} unit="%" width={35} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Chance']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="percent" fill="#34a0cf" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 2. Daily Sleep Chart (STACKED) */}
      <ChartCard>

        {/* 👈 2. Add this Custom Header Section */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Sleep per Day <span className="text-sm font-normal text-gray-500">(Last 7 Days)</span>
          </h3>
          
          {/* Custom Legend (Right Aligned) */}
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            {/* Nap Legend Item */}
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#c084fc]" /> {/* Purple */}
              <span>Nap</span>
            </div>
            {/* Night Legend Item */}
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" /> {/* Indigo */}
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
              
              <Tooltip 
                contentStyle={{ borderRadius: '8px' }}
                cursor={{ fill: 'transparent' }}
              />
              
              {/* 1. Night Sleep (Bottom) - Defined FIRST */}
              <Bar 
                dataKey="nightHours" 
                name="Night" 
                stackId="a" 
                fill="#3b82f6" // Indigo
              />
              
              {/* 2. Naps (Top) - Defined SECOND */}
              <Bar 
                dataKey="napHours" 
                name="Nap" 
                stackId="a" 
                fill="#c084fc" // Purple
                radius={[4, 4, 0, 0]} // Rounded corners only on the top bar
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 3. Nap Duration Histogram */}
      <ChartCard title="Nap Duration Distribution">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={napDurationData} margin={{ bottom: 40 }}>
              <XAxis dataKey="label" tick={<CustomTick />} interval={0} height={20} />
              <YAxis tick={{ fontSize: 12 }} width={30} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} naps`, 'Count']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

    </section>
  );
}