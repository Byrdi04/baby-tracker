'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type ChartDataPoint = {
  date: string;
  feeds: number;
};

type Props = {
  chartData: ChartDataPoint[];
};

export default function FeedCharts({ chartData }: Props) {
  return (
    <section className="mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Feeds per Day (Last 7 Days)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip 
                formatter={(value) => [`${value} feeds`, 'Total']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="feeds" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}