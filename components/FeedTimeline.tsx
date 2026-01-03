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

  // =========================================================
  // 🎨 COLOR CONFIGURATION AREA
  // Change the 'bg-' (Inner Dot) and 'border-' (Outer Ring) classes here.
  // =========================================================
  const getStyle = (type: string) => {
    switch (type) {
      case 'Breastfeeding': 
        return { 
          bg: 'bg-yellow-100',       // Inner Circle Color
          border: 'border-yellow-800' // Outer Ring Color
        };
      case 'Bottle': 
        return { 
          bg: 'bg-blue-500', 
          border: 'border-blue-200' 
        };
      case 'Solid food': 
        return { 
          bg: 'bg-green-100', 
          border: 'border-green-800' 
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
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
      <h3 className="text-sm text-slate-700 dark:text-slate-300 mb-4">
        Feeding Schedule (7.00 - 7.00)
      </h3>

      <div className="relative">
        <div className="space-y-4 mt-2">
          {data.map((day, dIndex) => (
            <div key={dIndex} className="flex items-center gap-3">
              
              <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                {day.date}
              </div>

              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full relative mt-1">
                
                {gridMarkers.map((left) => (
                   <div key={left} className="absolute -top-2 -bottom-2 border-l border-dashed border-gray-200 dark:border-gray-600" style={{ left }} />
                ))}

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
                          THE DOT MARKER
                          - Removed {style.icon}
                          - Changed w-6 h-6 to w-4 h-4 (Smaller since no icon)
                          - Increased border-2 to border-4 (Thicker ring)
                      */}
                      <div className={`
                        w-3.5 h-3.5 rounded-full shadow-sm 
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
          ))}
        </div>
      </div>
    </div>
  );
}