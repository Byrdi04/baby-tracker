'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; 

type DailyDataPoint = {
  date: string;
  changes: number;
  notes: string[]; // 👈 Add this
};

type WeeklyDataPoint = {
  week: string;
  changes: number;
};

type Props = {
  dailyChartData: DailyDataPoint[];
  weeklyChartData: WeeklyDataPoint[];
};

// 1. CUSTOM TOOLTIP COMPONENT
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DailyDataPoint;
    
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl text-xs z-50">
        <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">
          {label}
        </p>
        <p className="text-orange-600 font-semibold mb-2">
          {data.changes} changes
        </p>
        
        {/* Render Notes if they exist */}
        {data.notes.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-1">
            <p className="text-[10px] text-gray-400 mb-1">NOTES:</p>
            <ul className="list-disc pl-3 space-y-1">
              {data.notes.map((note, i) => (
                <li key={i} className="text-gray-600 dark:text-gray-300">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// 2. CUSTOM LABEL COMPONENT (The Bubble Icon)
const NoteIconLabel = (props: any) => {
  const { x, y, width, value, index, data } = props;
  // Get notes for this specific bar index
  const notes = data[index]?.notes || [];

  if (notes.length === 0) return null;

  return (
    <text 
      x={x + width / 2} 
      y={y - 8} 
      fill="#666" 
      textAnchor="middle" 
      fontSize="14"
      dominantBaseline="middle"
    >
      💬
    </text>
  );
};

export default function DiaperCharts({ dailyChartData, weeklyChartData }: Props) {
  return (
    <section className="mb-6 space-y-6">
      
      {/* Daily Chart */}
      <ChartCard title="Changes per Day (Last 7 Days)">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData} margin={{ top: 20 }}> {/* Add top margin for the icon */}
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              
              {/* Use Custom Tooltip */}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              
              <Bar dataKey="changes" fill="#f97316" radius={[4, 4, 0, 0]}>
                {/* Add the Icon Label */}
                <LabelList 
                  dataKey="changes" 
                  content={(props) => <NoteIconLabel {...props} data={dailyChartData} />} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Weekly Chart (Unchanged, standard tooltip) */}
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