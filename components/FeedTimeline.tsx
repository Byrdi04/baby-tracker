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

  useEffect(() => {
    const handleGlobalClick = () => {
      setActivePoint(null);
    };
    window.addEventListener('click', handleGlobalClick);
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

  // Helper: Just get the icon now
  const getIcon = (type: string) => {
    switch (type) {
      case 'Breastfeeding': return '🤱';
      case 'Bottle': return '🍼';
      case 'Solid food': return '🥣';
      default: return '🍽️';
    }
  };

  const gridMarkers = ['0%', '25%', '50%', '75%', '100%'];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Feeding Schedule (7am - 7am)
      </h3>

      <div className="relative">
        <div className="space-y-6 mt-2">
          {data.map((day, dIndex) => (
            <div key={dIndex} className="flex items-center gap-3">
              
              {/* Date Label */}
              <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                {day.date}
              </div>

              {/* The Timeline Track */}
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full relative mt-1">
                
                {/* Grid Lines */}
                {gridMarkers.map((left) => (
                   <div key={left} className="absolute -top-2 -bottom-2 border-l border-dashed border-gray-200 dark:border-gray-600" style={{ left }} />
                ))}

                {/* Feed Points */}
                {day.points.map((point, pIndex) => {
                  const icon = getIcon(point.type);
                  const isActive = activePoint?.dIndex === dIndex && activePoint?.pIndex === pIndex;

                  return (
                    <div
                      key={pIndex}
                      onClick={(e) => handlePointClick(e, dIndex, pIndex)}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-transform duration-200 flex items-center justify-center 
                        ${isActive ? 'scale-150 z-20' : 'hover:scale-125 z-10'}
                      `}
                      style={{ left: `${point.left}%` }}
                    >
                      {/* 
                          The Dot Marker (Now just the Big Emoji) 
                          text-2xl makes it bigger.
                          drop-shadow helps it pop off the line.
                          select-none prevents highlighting it like text.
                      */}
                      <div className="text-xl drop-shadow-sm select-none leading-none">
                        {icon}
                      </div>

                      {/* Tooltip */}
                      {isActive && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none">
                          <p className="font-bold text-sm">{point.time}</p>
                          <p className="text-[10px] opacity-80">{point.type}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
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