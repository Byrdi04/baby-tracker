import StatCard from '@/components/ui/StatCard';

type Stats = {
  medianDailyHours: number;
  medianDailyMins: number;
  medianNightHours: number;
  medianNightMins: number;
  medianWakeTime: string;
  medianBedTime: string;
  // New "Last Night" variables
  lastNightHours: number;
  lastNightMins: number;
  lastTotalHours: number;
  lastTotalMins: number;
};

export default function SleepStats({ stats }: { stats: Stats }) {
  return (
    <div className="mb-4">
      <section className="grid grid-cols-2 gap-2">
        {/* Row 1: 14-Day Averages */}
        <StatCard 
          label="Avg total sleep" 
          value={`${stats.medianDailyHours}h ${stats.medianDailyMins}m`} 
          color="blue" 
        />
        <StatCard 
          label="Avg night sleep" 
          value={stats.medianNightHours > 0 ? `${stats.medianNightHours}h ${stats.medianNightMins}m` : `${stats.medianNightMins}m`}
          color="indigo" 
        />
        
        {/* Row 2: REPLACED CARDS (Last Night / Last 24h) */}
        <StatCard 
          label="Total sleep yesterday" 
          value={`${stats.lastTotalHours}h ${stats.lastTotalMins}m`}
          color="fuchsia" 
        />
        <StatCard 
          label="Last night's sleep" 
          value={`${stats.lastNightHours}h ${stats.lastNightMins}m`}
          color="purple" 
        />
        
        {/* Row 3: Timings */}
        <StatCard 
          label="Avg wake up time" 
          value={stats.medianWakeTime}
          icon='☀️'
          color="yellow" 
        />
        <StatCard 
          label="Avg bedtime" 
          value={stats.medianBedTime}
          icon='🛌'
          color="orange" 
        />
      </section>
    </div>
  );
}