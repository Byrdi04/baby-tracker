'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type ChartDataPoint = {
  date: string;
  weight: number;
};

type Props = {
  chartData: ChartDataPoint[];
};

export default function WeightCharts({ chartData }: Props) {
  // Calculate average for trend line
  const avgWeight = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + d.weight, 0) / chartData.length
    : 0;

  return (
    <section className="mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Growth Chart
        </h3>
        <div className="h-56">
          {chartData.length < 2 ? (
            <p className="text-gray-400 text-center italic py-16">
              Need at least 2 entries to show chart
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  unit=" kg"
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} kg`, 'Weight']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <ReferenceLine 
                  y={avgWeight} 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5" 
                  label={{ value: 'Avg', fontSize: 10, fill: '#94a3b8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}