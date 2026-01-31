'use client';

import { useState } from 'react';
import { fetchHistoryChunk } from '@/app/actions';
import SleepTimeline from '@/components/SleepTimeline';
import FeedTimeline from '@/components/FeedTimeline';

type Props = {
  type: 'SLEEP' | 'FEED';
  initialData: any[];
};

export default function HistoryList({ type, initialData }: Props) {
  // 1. Initialize with the data passed from the Server
  const [data, setData] = useState<any[]>(initialData);
  
  // 2. Start at Page 1 (Because Page 0 is already in initialData)
  const [page, setPage] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialData.length > 0);

  const loadMore = async () => {
    setLoading(true);
    try {
      // Fetch the next chunk (Page 1, then Page 2...)
      const newRows = await fetchHistoryChunk(type, page);
      
      if (newRows.length === 0) {
        setHasMore(false);
      } else {
        // Append new rows to existing list
        setData(prev => [...prev, ...newRows]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  // ❌ NO useEffect here. 
  // We do NOT want to fetch automatically on mount, 
  // because the server already did it for us.

  return (
    <div className="space-y-4">
      {type === 'SLEEP' ? (
        <SleepTimeline data={data} />
      ) : (
        <FeedTimeline data={data} />
      )}

      <div className="py-4 text-center">
        {loading && <p className="text-gray-500 text-sm">Loading history...</p>}
        
        {!loading && hasMore && (
          <button 
            onClick={loadMore}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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