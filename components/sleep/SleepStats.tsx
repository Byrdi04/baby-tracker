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
        label="Avg Total Sleep" 
        value={`${stats.medianDailyHours}h ${stats.medianDailyMins}m`} 
        color="blue" 
      />
      <StatCard 
        label="Avg Night Sleep" 
        value={stats.medianNightHours > 0 ? `${stats.medianNightHours}h ${stats.medianNightMins}m` : `${stats.medianNightMins}m`}
        color="indigo" 
      />
      <StatCard 
        label="Avg Nap Length" 
        value={stats.medianNapHours > 0 ? `${stats.medianNapHours}h ${stats.medianNapMins}m` : `${stats.medianNapMins}m`}
        color="fuchsia" 
      />
      <StatCard 
        label="Avg Naps pr. Day" 
        value={stats.avgNapsPerDay}
        color="purple" 
      />
      <StatCard 
        label="Avg Wake Up Time" 
        value={stats.medianWakeTime}
        icon='☀️'
        color="yellow" 
      />
      <StatCard 
        label="Avg Bedtime" 
        value={stats.medianBedTime}
        icon='🛌'
        color="orange" 
      />
    </section>
  );
}