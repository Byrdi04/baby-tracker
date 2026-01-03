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

  // 1. NEW: Global listener to close popup when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveBlock(null);
    };

    // Attach listener
    window.addEventListener('click', handleGlobalClick);

    // Cleanup listener when component unmounts
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const gridMarkers = ['0%', '25%', '50%', '75%', '100%'];

  // 2. UPDATED: Pass the event object (e) to the handler
  const handleBlockClick = (e: React.MouseEvent, dIndex: number, bIndex: number) => {
    // 🛑 STOP the click from bubbling up to the window (which would close it immediately)
    e.stopPropagation();

    if (activeBlock?.dIndex === dIndex && activeBlock?.bIndex === bIndex) {
      setActiveBlock(null);
    } else {
      setActiveBlock({ dIndex, bIndex });
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
      <h3 className="text-sm text-slate-700 dark:text-slate-300 mb-4">
        Sleep Schedule (7.00 - 7.00)
      </h3>

      <div className="relative">
        <div className="space-y-5 mt-2">
          {data.map((day, dIndex) => (
            <div key={dIndex} className="flex items-center gap-3">
              
              <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                {day.date}
              </div>

              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                
                {gridMarkers.map((left) => (
                   <div key={left} className="absolute top-0 bottom-0 border-l border-dashed border-gray-200 dark:border-gray-600" style={{ left }} />
                ))}

                {day.blocks.map((block, bIndex) => {
                  const isActive = activeBlock?.dIndex === dIndex && activeBlock?.bIndex === bIndex;

                  return (
                    <div
                      key={bIndex}
                      // 3. UPDATED: Pass 'e' to the function
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
          ))}
        </div>
      </div>
    </div>
  );
}