'use client';

import EventItemShell from './EventItemShell';
import { calculateInterpolatedPercentile } from '@/lib/growthUtils';
import { toPercentilePoints } from '@/lib/growthTables';

// Helper for the date format (e.g. "15 Jan")
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function WeightItem({
  event,
  prevEvent,
  onClick,
  birthDate,
  gender,
  correctedOffsetMs,
}: {
  event: any;
  prevEvent?: any;
  onClick: () => void;
  birthDate: string;
  gender: 'male' | 'female';
  correctedOffsetMs: number;
}) {
  const data = JSON.parse(event.data || '{}');
  const weight = parseFloat(data.amount || 0);

  // 1. Calculate Days Ago
  const daysAgo = Math.floor((Date.now() - new Date(event.startTime).getTime()) / (1000 * 60 * 60 * 24));
  let title = '';
  if (daysAgo === 0) {
    title = 'Today';
  } else if (daysAgo === 1) {
    title = 'Yesterday';
  } else if (daysAgo <= 7) {
    title = `${daysAgo} days ago`;
  } else {
    title = formatDate(event.startTime);
  }

  // 2. Actual age percentile
  const growthData = toPercentilePoints(gender, birthDate);
  const percentile = calculateInterpolatedPercentile(weight, event.startTime, growthData) || '--%';

  // 3. Corrected age percentile (if offset is non-zero)
  let correctedPercentile: string | null = null;
  if (correctedOffsetMs > 0) {
    const correctedGrowthData = toPercentilePoints(gender, birthDate, correctedOffsetMs);
    correctedPercentile = calculateInterpolatedPercentile(weight, event.startTime, correctedGrowthData);
  }

  // 4. Rate Calculation with Color Logic
  let rateDisplay = null;

  if (prevEvent) {
    const prevWeight = parseFloat(JSON.parse(prevEvent.data || '{}').amount || 0);
    const diffG = (weight - prevWeight) * 1000;
    const diffDays = (new Date(event.startTime).getTime() - new Date(prevEvent.startTime).getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 0) {
      const rate = Math.round(diffG / diffDays);
      const text = `(${diffG > 0 ? '+' : ''}${rate} g/day)`;

      const colorClass = rate >= 0
        ? 'text-green-700 dark:text-green-400'
        : 'text-red-700 dark:text-red-400';

      rateDisplay = (
        <span className={colorClass}>
          {text}
        </span>
      );
    }
  }

  // Build percentile display
  const percentileDisplay = correctedPercentile
    ? `${percentile} (corr. ${correctedPercentile})`
    : percentile;

  return (
    <EventItemShell
      onClick={onClick}
      colorTheme="green"
      icon="⚖️"
      title={`Weight`}
      subText={title}
      rightTop={
        <div className="flex items-center justify-end gap-2">
          <span>{weight} kg</span>
          {rateDisplay}
        </div>
      }
      rightBottom={percentileDisplay}
    />
  );
}
