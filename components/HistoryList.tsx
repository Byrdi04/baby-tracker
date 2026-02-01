'use client';

import { useState, useMemo } from 'react';
import { fetchHistoryChunk } from '@/app/actions';
import SleepTimeline from '@/components/SleepTimeline';
import FeedTimeline from '@/components/FeedTimeline';

import { processSleepStats, generateTimelineData } from '@/lib/sleep-logic';
import { generateFeedTimeline } from '@/lib/feed-logic';

// 1. Define the shapes of your data based on your logic files
// This fixes the "DayRow" error by strictly defining what the components expect.
type SleepRow = {
  date: string;
  rawDate: string;
  blocks: {
    left: number;
    width: number;
    isNight: boolean;
    isOngoing: boolean;
    info: { time: string; duration: string };
  }[];
};

type FeedRow = {
  date: string;
  rawDate: string;
  points: any[]; // You can be more specific here if you know the feed structure
};

type Props = {
  type: 'SLEEP' | 'FEED';
  initialData: any; 
};

export default function HistoryList({ type, initialData }: Props) {
  const [chunks, setChunks] = useState<any[]>([initialData]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialData.events.length > 0);

  const processedData = useMemo(() => {
    const allEvents = chunks.flatMap(c => c.events);

    const DAYS_PER_CHUNK = 14;
    const totalDays = chunks.length * DAYS_PER_CHUNK;

    if (type === 'SLEEP') {
      const { nightEventIds } = processSleepStats(allEvents);
      return generateTimelineData(allEvents, nightEventIds, new Date(), totalDays);
    } else {
      return generateFeedTimeline(allEvents, new Date(), totalDays);
    }
  }, [chunks, type]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const newChunk = await fetchHistoryChunk(type, page);
      
      if (newChunk.events.length === 0) {
        setHasMore(false);
      } else {
        setChunks(prev => [...prev, newChunk]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {type === 'SLEEP' ? (
        // 2. Use 'as SleepRow[]' to tell TypeScript: "Trust me, this is sleep data"
        <SleepTimeline data={processedData as SleepRow[]} />
      ) : (
        // 3. Use 'as FeedRow[]' for the feed section
        <FeedTimeline data={processedData as FeedRow[]} />
      )}

      <div className="py-4 text-center">
        {loading && <p className="text-gray-500 text-sm">Loading history...</p>}
        
        {!loading && hasMore && (
          <button 
            onClick={loadMore}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            Load previous 14 days
          </button>
        )}

        {!loading && !hasMore && (
          <p className="text-gray-400 text-xs">End of history</p>
        )}
      </div>
    </div>
  );
}