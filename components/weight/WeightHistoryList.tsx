import { STATIC_GROWTH_DATA } from '@/data/growth_curve';
import { calculateInterpolatedPercentile } from '@/lib/growthUtils';

// Helper: Format time
const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
};

// Helper: Format date
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
};

type Props = {
  events: any[]; // Or define your Event interface
};

export default function WeightHistoryList({ events }: Props) {
  
  const getWeightChange = (index: number) => {
    if (index >= events.length - 1) return null;
    const current = parseFloat(JSON.parse(events[index].data).amount);
    const prev = parseFloat(JSON.parse(events[index + 1].data).amount);
    return current - prev;
  };

  if (events.length === 0) {
    return <p className="text-gray-400 text-center italic mt-10">No entries yet.</p>;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
        All Entries
      </h2>
      
      {events.map((event, index) => {
        const weight = parseFloat(JSON.parse(event.data).amount);
        const change = getWeightChange(index);
        
        // Use the new Interpolated calculation
        const percentile = calculateInterpolatedPercentile(
          weight, 
          event.startTime, 
          STATIC_GROWTH_DATA
        );

        return (
          <div key={event.id} className="bg-sky-50 dark:bg-sky-950 p-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-cyan-100 dark:bg-cyan-900 p-2 rounded-full text-xl">⚖️</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(event.startTime)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(event.startTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900 dark:text-white">{weight} kg</p>
              {change !== null && (
                <p className={`text-xs font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(2)} kg
                  {percentile && (
                    <span className="ml-2 text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900 px-1.5 py-0.5 rounded">
                      {percentile}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}