'use client';

import { useState, useEffect } from 'react';

type SleepBlock = {
  left: number;
  width: number;
  isNight: boolean;
  isOngoing?: boolean; // 👈 Add optional type
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
  const [currentPos, setCurrentPos] = useState<number | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>('');

  useEffect(() => {
    const handleGlobalClick = () => { setActiveBlock(null); };
    window.addEventListener('click', handleGlobalClick);

    const now = new Date();
    const checkDate = new Date();
    if (checkDate.getHours() < 7) checkDate.setDate(checkDate.getDate() - 1);
    
    setTodayLabel(checkDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));

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

  // Helper to determine color class
  const getBlockColor = (block: SleepBlock, isActive: boolean) => {
    // 1. Base Logic
    let classes = "";
    
    if (block.isOngoing) {
      // 🟢 ONGOING: teal
      classes = "bg-teal-500/90 border-emerald-500/0"; 
    } else if (block.isNight) {
      // 🔵 NIGHT: Blue
      classes = "bg-blue-500/80 border-blue-500/0";
    } else {
      // 🟣 NAP: Purple
      classes = "bg-purple-400/80 border-purple-400/0";
    }

    // 2. Active State (White border + Shadow)
    if (isActive) {
      classes += " !border-white dark:!border-gray-200 shadow-md z-20";
    } else {
      classes += " z-10";
    }

    return classes;
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Sleep Schedule (7.00 - 7.00)
      </h3>

      <div className="relative">
        <div className="space-y-5 mt-2">
          {data.map((day, dIndex) => {
            const isToday = day.date === todayLabel;

            return (
              <div key={dIndex} className="flex items-center gap-3">
                <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                  {day.date}
                </div>

                <div className="flex-1 h-4 bg-slate-300 dark:bg-gray-700 rounded-full relative">
                  
                  {gridMarkers.map((left) => (
                     <div key={left} className="absolute top-0 bottom-0 border-l border-dashed border-gray-200 dark:border-gray-600" style={{ left }} />
                  ))}

                  {isToday && currentPos !== null && (
                    <div 
                      className="absolute -top-0 -bottom-0 w-[2px] bg-slate-600 z-0 pointer-events-none shadow-sm flex flex-col items-center"
                      style={{ left: `${currentPos}%` }}
                    >
                      <span className="absolute top-full mt-1 text-[9px] font-bold text-slate-600 tracking-widest leading-none">
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
                        // 👇 UPDATED: Use helper function for cleaner classes
                        className={`absolute h-full rounded-sm cursor-pointer transition-all border-2 ${getBlockColor(block, isActive)}`}
                        style={{
                          left: `${block.left}%`,
                          width: `${block.width}%`,
                        }}
                      >
                        {isActive && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-30 pointer-events-none">
                            {/* Add pulse effect text if ongoing */}
                            <p className="font-bold flex items-center gap-1">
                              {block.isOngoing && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>}
                              {block.info.duration}
                            </p>
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