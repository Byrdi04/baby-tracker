'use client';

import { useState, useEffect } from 'react';

type FeedPoint = {
  left: number;
  type: string;
  time: string;
};

type DayRow = {
  date: string;
  points: FeedPoint[];
};

export default function FeedTimeline({ data }: { data: DayRow[] }) {
  const [activePoint, setActivePoint] = useState<{ dIndex: number; pIndex: number } | null>(null);

  // 1. NEW STATE: Track the current timeline position and today's label
  const [currentPos, setCurrentPos] = useState<number | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>('');

  useEffect(() => {
    const handleGlobalClick = () => {
      setActivePoint(null);
    };
    window.addEventListener('click', handleGlobalClick);

    // 2. NEW LOGIC: Calculate "Now"
    const now = new Date();

    // A. Find "Today's" label to match the data prop (e.g., "Mon 15")
    // We apply the same 7am shift logic used on the server
    const checkDate = new Date();
    if (checkDate.getHours() < 7) checkDate.setDate(checkDate.getDate() - 1);
    
    // This formatting must match what you used in page.tsx
    setTodayLabel(checkDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));

    // B. Calculate position % (7am = 0%, 7am next day = 100%)
    let hours = now.getHours() + (now.getMinutes() / 60);
    if (hours < 7) hours += 24; // Handle 00:00 - 06:59 wrapping
    const relativeHours = hours - 7;
    setCurrentPos((relativeHours / 24) * 100);

    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handlePointClick = (e: React.MouseEvent, dIndex: number, pIndex: number) => {
    e.stopPropagation();
    if (activePoint?.dIndex === dIndex && activePoint?.pIndex === pIndex) {
      setActivePoint(null);
    } else {
      setActivePoint({ dIndex, pIndex });
    }
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'Breastfeeding': 
        return { 
          bg: 'bg-yellow-100 dark:bg-yellow-900',       
          border: 'border-yellow-500' 
        };
      case 'Bottle': 
        return { 
          bg: 'bg-cyan-100 dark:bg-cyan-900', 
          border: 'border-cyan-500' 
        };
      case 'Solid food': 
        return { 
          bg: 'bg-green-100 dark:bg-green-900', 
          border: 'border-green-500' 
        };
      default: 
        return { 
          bg: 'bg-gray-500', 
          border: 'border-gray-300' 
        };
    }
  };

  const gridMarkers = ['0%', '25%', '50%', '75%', '100%'];

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-4">
      <h3 className="text-sm text-slate-700 font-semibold dark:text-slate-300 mb-4">
        Feeding Schedule (7.00 - 7.00)
      </h3>

      <div className="relative">
        <div className="space-y-4 mt-2">
          {data.map((day, dIndex) => {
            // Check if this row corresponds to "Today"
            const isToday = day.date === todayLabel;

            return (
              <div key={dIndex} className="flex items-center gap-3">
                
                <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                  {day.date}
                </div>

                <div className="flex-1 h-4 bg-slate-300 dark:bg-gray-700 rounded-full relative mt-1">
                  
                  {gridMarkers.map((left) => (
                     <div key={left} className="absolute -top-2 -bottom-2 border-l border-dashed border-gray-200 dark:border-gray-600" style={{ left }} />
                  ))}

                  {/* 3. NEW: The "Now" Line and Label */}
                  {isToday && currentPos !== null && (
                    <div 
                      className="absolute -top-0 -bottom-0 w-[2px] bg-slate-600 z-0 pointer-events-none shadow-sm flex flex-col items-center"
                      style={{ left: `${currentPos}%` }}
                    >
                      {/* The Text Label */}
                      <span className="absolute top-full mt-1 text-[9px] font-bold text-slate-600 tracking-widest leading-none">
                        Now
                      </span>
                    </div>
                  )}

                  {day.points.map((point, pIndex) => {
                    const style = getStyle(point.type);
                    const isActive = activePoint?.dIndex === dIndex && activePoint?.pIndex === pIndex;

                    return (
                      <div
                        key={pIndex}
                        onClick={(e) => handlePointClick(e, dIndex, pIndex)}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-all z-10 flex items-center justify-center 
                          ${isActive ? 'scale-125 z-20' : 'hover:scale-110'}
                        `}
                        style={{ left: `${point.left}%` }}
                      >

                        {/* 
                           4. UPDATED SHADOWS:
                           Changed 'shadow-sm' to 'shadow-md'
                           Added 'ring-1 ring-black/20' for definition
                        */}
                        <div className={`
                          w-3.5 h-3.5 rounded-full 
                          shadow-md 
                          ${style.bg} 
                          border-1 ${style.border} dark:border-opacity-50
                        `}></div>

                        {/* Tooltip */}
                        {isActive && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-30 pointer-events-none">
                            <p className="font-bold">{point.time}</p>
                            <p className="text-[10px] opacity-80">{point.type}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}