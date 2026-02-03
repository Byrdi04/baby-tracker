// components/feed/FeedStats.tsx
import StatCard from '@/components/ui/StatCard';

// Helper for styles (Pure UI, so it stays in the component)
const getFeedStyle = (feedType: string) => {
  switch (feedType) {
    case 'Breastfeeding':
      return { icon: '🤱', bg: 'bg-yellow-100 dark:bg-yellow-700', text: 'text-yellow-900 dark:text-yellow-100' };
    case 'Bottle':
      return { icon: '🍼', bg: 'bg-blue-100 dark:bg-blue-800', text: 'text-blue-800 dark:text-blue-100' };
    case 'Solid food':
      return { icon: '🥣', bg: 'bg-green-200 dark:bg-green-700', text: 'text-green-900 dark:text-green-100' };
    default:
      return { icon: '🍼', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-100' };
  }
};

type Props = {
  stats: {
    avgFeedsPerDay: number;
    avgGapHours: number;
    avgGapMins: number;
    feedTypeData: Array<{ name: string; styleType: string; value: number }>;
  }
};

export default function FeedStats({ stats }: Props) {
  return (
    <>
      {/* 1. Top Stats Grid */}
      <section className="grid grid-cols-2 gap-4 mb-4">
        <StatCard 
          label="Avg feeds pr. day" 
          value={`${stats.avgFeedsPerDay.toFixed(0)}`} 
          color="purple" 
        />
        <StatCard 
          label="Avg time between" 
          value={`${stats.avgGapHours}h ${stats.avgGapMins}m`} 
          color="red" 
        />
      </section>

      {/* 2. Feed Type Breakdown */}
      <section className="bg-slate-100 dark:bg-gray-800 p-4 rounded-xl dark:border-gray-700 mb-4">
        <h3 className="text-sm text-slate-700 font-semibold dark:text-gray-300 mb-3">
          Feed Types (Avg / Day)
        </h3>
        <div className="flex gap-2 flex-wrap">
          {stats.feedTypeData.map(({ name, styleType, value }) => {
            const style = getFeedStyle(styleType);
            
            return (
              <div 
                key={name}
                className={`${style.bg} ${style.text} px-3 py-2 rounded-lg flex items-center gap-2`}
              >
                <span>{style.icon}</span>
                <span className="font-semibold">{value}</span>
                <span className="text-sm opacity-75">{name}</span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}