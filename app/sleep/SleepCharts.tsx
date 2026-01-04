'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type ChartDataPoint = {
  label: string;
  value: number;
};

type Props = {
  chartData: { date: string; hours: number }[];
  napDurationData: ChartDataPoint[];
  napStartTimeData: ChartDataPoint[];
};

// 1. Define the Custom Tick here
const CustomTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={4} 
        textAnchor="end" 
        fill="#9CA3AF" // tailwind gray-400
        transform="rotate(-90)" 
        fontSize={10}
      >
        {payload.value}
      </text>
    </g>
  );
};

export default function SleepCharts({ chartData, napDurationData, napStartTimeData }: Props) {
  return (
    <section className="space-y-6 mb-6">
      
      {/* 1. Daily Sleep Chart (Unchanged) */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Sleep per Day (Last 7 Days)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={30} unit="h" />
              <Tooltip formatter={(value) => [`${value} hours`, 'Sleep']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Nap Duration Histogram (Rotated Labels) */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Nap Duration Distribution
        </h3>
        <div className="h-60"> {/* 👈 Increased Height */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={napDurationData} margin={{ bottom: 40 }}> {/* 👈 Added Margin */}
              <XAxis 
                dataKey="label" 
                tick={<CustomTick />} // 👈 Use Custom Component
                interval={0}
                height={20} // 👈 Reserve space for labels
              />
              <YAxis tick={{ fontSize: 12 }} width={30} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} naps`, 'Count']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Nap Start Time Histogram (Rotated Labels) */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Nap Start Times
        </h3>
        <div className="h-60"> {/* 👈 Increased Height */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={napStartTimeData} margin={{ bottom: 40 }}> {/* 👈 Added Margin */}
              <XAxis 
                dataKey="label" 
                tick={<CustomTick />} // 👈 Use Custom Component
                interval={0} 
                height={10} // 👈 Reserve space
              /> 
              <YAxis tick={{ fontSize: 12}} width={30} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} naps`, 'Started']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}