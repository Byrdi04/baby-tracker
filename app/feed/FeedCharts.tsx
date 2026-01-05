'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; 

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
      <ChartCard title="Feeds per Day (Last 7 Days)">
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
      </ChartCard>
    </section>
  );
}