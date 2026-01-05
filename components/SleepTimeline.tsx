'use client';

import { useState, useEffect } from 'react';

type SleepBlock = {
  left: number;
  width: number;
  isNight: boolean;
  info: {
    time: string;
    duration: string;
  };
};

type DayRow = {
  date: string;
  blocks: SleepBlock[];
};

export default function SleepTimeline({ data }: { data: DayRow[] }) {
  const [activeBlock, setActiveBlock] = useState<{ dIndex: number; bIndex: number } | null>(null);

  // 1. NEW STATE: Track "Now" position
  const [currentPos, setCurrentPos] = useState<number | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>('');

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveBlock(null);
    };

    window.addEventListener('click', handleGlobalClick);

    // 2. NEW LOGIC: Calculate "Now" for 7am-7am cycle
    const now = new Date();
    
    // A. Find "Today's" label
    const checkDate = new Date();
    if (checkDate.getHours() < 7) checkDate.setDate(checkDate.getDate() - 1);
    
    // Must match format in page.tsx
    setTodayLabel(checkDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));

    // B. Calculate position %
    let hours = now.getHours() + (now.getMinutes() / 60);
    if (hours < 7) hours += 24; 
    const relativeHours = hours - 7;
    setCurrentPos((relativeHours / 24) * 100);

    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const gridMarkers = ['0%', '25%', '50%', '75%', '100%'];

  const handleBlockClick = (e: React.MouseEvent, dIndex: number, bIndex: number) => {
    e.stopPropagation();

    if (activeBlock?.dIndex === dIndex && activeBlock?.bIndex === bIndex) {
      setActiveBlock(null);
    } else {
      setActiveBlock({ dIndex, bIndex });
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Sleep Schedule (7.00 - 7.00)
      </h3>

      <div className="relative">
        <div className="space-y-5 mt-2">
          {data.map((day, dIndex) => {
            // Check if this row is today
            const isToday = day.date === todayLabel;

            return (
              <div key={dIndex} className="flex items-center gap-3">
                
                <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                  {day.date}
                </div>

                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                  
                  {gridMarkers.map((left) => (
                     <div key={left} className="absolute top-0 bottom-0 border-l border-dashed border-gray-200 dark:border-gray-600" style={{ left }} />
                  ))}

                  {/* 3. NEW: The "Now" Line and Label */}
                  {isToday && currentPos !== null && (
                    <div 
                      className="absolute -top-0 -bottom-0 w-[2px] bg-gray-400 z-0 pointer-events-none shadow-sm flex flex-col items-center"
                      style={{ left: `${currentPos}%` }}
                    >
                      <span className="absolute top-full mt-1 text-[9px] font-bold text-gray-400 tracking-widest leading-none">
                        Now
                      </span>
                    </div>
                  )}

                  {day.blocks.map((block, bIndex) => {
                    const isActive = activeBlock?.dIndex === dIndex && activeBlock?.bIndex === bIndex;

                    return (
                      <div
                        key={bIndex}
                        onClick={(e) => handleBlockClick(e, dIndex, bIndex)}
                        className={`absolute h-full rounded-sm cursor-pointer transition-all border-2 ${
                          block.isNight 
                            ? 'bg-blue-500/80 dark:bg-blue-400/80 border-blue-600/0' 
                            : 'bg-purple-400/80 dark:bg-purple-400/80 border-purple-500/0'
                        } ${isActive ? '!border-white dark:!border-gray-200 shadow-md z-20' : 'z-10'}`}
                        style={{
                          left: `${block.left}%`,
                          width: `${block.width}%`,
                        }}
                      >
                        {isActive && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-30 pointer-events-none">
                            <p className="font-bold">{block.info.duration}</p>
                            <p className="text-[10px] opacity-80">{block.info.time}</p>
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