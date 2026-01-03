'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type ChartDataPoint = {
  date: string;
  hours: number;
};

type Props = {
  chartData: ChartDataPoint[];
};

export default function SleepCharts({ chartData}: Props) {
  return (
    <section className="mb-6 space-y-6">
      
      {/* Daily Sleep Chart */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
        <h3 className="text-sm text-slate-700 dark:text-slate-300 mb-4">
          Sleep per Day (Last 7 Days)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="h" />
              <Tooltip 
                formatter={(value) => [`${value} hours`, 'Sleep']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}