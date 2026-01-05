'use client';

// 1. Import Area and AreaChart
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import ChartCard from '@/components/ui/ChartCard'; 

type ChartDataPoint = {
  label: string;
  value: number;
};

// 2. Define the new data type for probability
type ProbabilityPoint = {
  time: string; // "14:10"
  percent: number; // 65 (for 65%)
};

type Props = {
  chartData: { date: string; hours: number }[];
  napDurationData: ChartDataPoint[];
  napStartTimeData: ChartDataPoint[];
  sleepProbabilityData: ProbabilityPoint[]; // 👈 NEW PROP
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
            {/* 👇 Changed to BarChart, added gap setting */}
            <BarChart data={sleepProbabilityData} barCategoryGap={0}>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }} 
                interval={17} 
              />
              
              <YAxis 
                tick={{ fontSize: 12 }} 
                unit="%" 
                width={35}
                // 👇 NEW: Force axis to start at 20 and end at 100
                domain={[10, 100]} 
                ticks={[20, 30, 40, 50, 60, 70, 80, 90, 100]}
                allowDataOverflow={true}
              />
              
              <Tooltip 
                cursor={{ fill: 'transparent' }} // Hides the gray hover bar background
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Chance of Sleep']}
                contentStyle={{ borderRadius: '8px' }}
              />
              
              {/* 👇 Changed to Bar */}
              <Bar 
                dataKey="percent" 
                fill="#34a0cf"
                radius={[2, 2, 0, 0]} // Slight rounding on top
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 2. Daily Sleep Chart */}
      <ChartCard title="Sleep per Day (Last 7 Days)">
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
      </ChartCard>

      {/* 3. Nap Duration Histogram */}
      <ChartCard title="Nap Duration Distribution">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={napDurationData} margin={{ bottom: 40 }}>
              <XAxis dataKey="label" tick={<CustomTick />} interval={0} height={20} />
              <YAxis tick={{ fontSize: 12 }} width={30} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} naps`, 'Count']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 4. Nap Start Time Histogram */}
      <ChartCard title="Nap Start Times">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={napStartTimeData} margin={{ bottom: 40 }}>
              <XAxis dataKey="label" tick={<CustomTick />} interval={0} height={10} /> 
              <YAxis tick={{ fontSize: 12}} width={30} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} naps`, 'Started']} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

    </section>
  );
}