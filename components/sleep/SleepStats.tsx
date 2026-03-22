import StatCard from '@/components/ui/StatCard';

type Stats = {
  medianDailyHours: number;
  medianDailyMins: number;
  medianNightHours: number;
  medianNightMins: number;
  avgNapsPerDay: string;
  medianWakeTime: string;
  medianBedTime: string;
  // NEW: Added the wake window stats to the type
  avgWakeWindowHours: number;
  avgWakeWindowMins: number; 
};

export default function SleepStats({ stats }: { stats: Stats }) {
  return (
    <section className="grid grid-cols-2 gap-2 mb-4">
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
      
      {/* REPLACED: Now shows Awake Time instead of Nap Length */}
      <StatCard 
        label="Avg awake time" 
        value={stats.avgWakeWindowHours > 0 ? `${stats.avgWakeWindowHours}h ${stats.avgWakeWindowMins}m` : `${stats.avgWakeWindowMins}m`}
        color="fuchsia" 
      />
      
      <StatCard 
        label="Avg naps pr. day" 
        value={Number(stats.avgNapsPerDay).toFixed(0)}
        color="purple" 
      />
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
  );
}