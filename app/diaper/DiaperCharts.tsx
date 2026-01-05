'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; 

type DailyDataPoint = {
  date: string;
  changes: number;
};

type WeeklyDataPoint = {
  week: string;
  changes: number;
};

type Props = {
  dailyChartData: DailyDataPoint[];
  weeklyChartData: WeeklyDataPoint[];
};

export default function DiaperCharts({ dailyChartData, weeklyChartData }: Props) {
  return (
    <section className="mb-6 space-y-6">
      
      {/* Daily Chart */}
      <ChartCard title="Changes per Day (Last 7 Days)">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip 
                formatter={(value) => [`${value} changes`, 'Total']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="changes" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Weekly Chart */}
      <ChartCard title="Changes per Week (Last 4 Weeks)">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip 
                formatter={(value) => [`${value} changes`, 'Total']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="changes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

    </section>
  );
}