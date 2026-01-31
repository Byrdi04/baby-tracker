// ================= HELPER FUNCTIONS =================
export const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
};

export const getDateKey = (dateStr: string): string => {
  return new Date(dateStr).toISOString().split('T')[0];
};

// ================= MAIN LOGIC =================

export function processFeedStats(feedEvents: any[]) {
  // 1. Feeds per day
  const feedsByDay: { [key: string]: number } = {};
  feedEvents.forEach(event => {
    const dateKey = getDateKey(event.startTime);
    feedsByDay[dateKey] = (feedsByDay[dateKey] || 0) + 1;
  });
  
  const dailyFeeds = Object.values(feedsByDay);
  const avgFeedsPerDay = dailyFeeds.length > 0 
    ? Math.round(dailyFeeds.reduce((a, b) => a + b, 0) / dailyFeeds.length * 10) / 10
    : 0;

  // 2. Average time between feeds
  let totalGapMinutes = 0;
  let gapCount = 0;
  
  for (let i = 0; i < feedEvents.length - 1; i++) {
    const current = new Date(feedEvents[i].startTime).getTime();
    const next = new Date(feedEvents[i + 1].startTime).getTime();
    const gapMinutes = (current - next) / 60000;
    
    // Only count gaps less than 12 hours (720 min)
    if (gapMinutes < 720) {
      totalGapMinutes += gapMinutes;
      gapCount++;
    }
  }
  
  const avgGapMinutes = gapCount > 0 ? Math.round(totalGapMinutes / gapCount) : 0;
  const avgGapHours = Math.floor(avgGapMinutes / 60);
  const avgGapMins = avgGapMinutes % 60;

  // 3. Feed type breakdown (AVG PER DAY)
  const feedTypeCounts: { [key: string]: number } = {};
  
  feedEvents.forEach(event => {
    const data = JSON.parse(event.data || '{}');
    const type = data.feedType || 'Unknown';
    feedTypeCounts[type] = (feedTypeCounts[type] || 0) + 1;
  });

  const numberOfDays = Object.keys(feedsByDay).length || 1;

  const feedTypeData = Object.entries(feedTypeCounts).map(([originalName, totalCount]) => {
    const displayName = originalName === 'Breastfeeding' ? 'Breast' : originalName;
    const avg = Math.round(totalCount / numberOfDays);
    return {
      name: displayName,       
      styleType: originalName, 
      value: avg               
    };
  });

  // 4. Chart Data (Last 7 Days)
  const chartData = Object.entries(feedsByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      feeds: count
    }));

  return {
    stats: {
      avgFeedsPerDay,
      avgGapHours,
      avgGapMins,
      feedTypeData
    },
    chartData
  };
}

export function generateFeedTimeline(
  feedEvents: any[], 
  referenceDate: Date = new Date(),
  daysToGenerate: number = 7
) {
  const timelineData = [];
  const current = new Date(referenceDate);
  
  if (new Date().toDateString() === current.toDateString() && current.getHours() < 7) {
    current.setDate(current.getDate() - 1);
  }

  for (let i = 0; i < daysToGenerate; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() - i);
    
    const cycleStart = new Date(d); 
    cycleStart.setHours(7, 0, 0, 0);
    
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + 1);

    const dayPoints = feedEvents
      .filter(e => {
        const time = new Date(e.startTime).getTime();
        return time >= cycleStart.getTime() && time < cycleEnd.getTime();
      })
      .map(e => {
        const start = new Date(e.startTime);
        const data = JSON.parse(e.data || '{}');
        
        let hours = start.getHours() + (start.getMinutes() / 60);
        if (hours < 7) hours += 24; 
        
        const relativeHours = hours - 7;
        const left = (relativeHours / 24) * 100;

        return {
          left,
          type: data.feedType || 'Unknown',
          time: formatTime(e.startTime)
        };
      });

    timelineData.push({
      // ✅ New line:
      date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      points: dayPoints
    });
  }
  return timelineData;
}