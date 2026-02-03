import StatCard from '@/components/ui/StatCard';

type Stats = {
  medianDailyHours: number;
  medianDailyMins: number;
  medianNightHours: number;
  medianNightMins: number;
  medianNapHours: number;
  medianNapMins: number;
  avgNapsPerDay: string;
  medianWakeTime: string;
  medianBedTime: string;
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
      <StatCard 
        label="Avg nap length" 
        value={stats.medianNapHours > 0 ? `${stats.medianNapHours}h ${stats.medianNapMins}m` : `${stats.medianNapMins}m`}
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