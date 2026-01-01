'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type ChartDataPoint = {
  date: string;
  hours: number;
};

type HourlyDataPoint = {
  hour: string;
  count: number;
};

type Props = {
  chartData: ChartDataPoint[];
  hourlyData: HourlyDataPoint[];
};

export default function SleepCharts({ chartData, hourlyData }: Props) {
  return (
    <section className="mb-6 space-y-6">
      
      {/* Daily Sleep Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Sleep per Day (Last 7 Days)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="h" />
              <Tooltip 
                formatter={(value: number) => [`${value} hours`, 'Sleep']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sleep Pattern by Hour */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Sleep Start Times
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 10 }}
                interval={3}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value} times`, 'Started sleep']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}