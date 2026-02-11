'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type FeedPoint = {
  left: number;
  type: string;
  time: string;
  note?: string;
};

type DayRow = {
  date: string;
  points: FeedPoint[];
};

type Props = {
  data: DayRow[];
  showHistoryLink?: boolean;
};

export default function FeedTimeline({ data, showHistoryLink = false }: Props) {
  const [activePoint, setActivePoint] = useState<{ dIndex: number; pIndex: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<number | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>('');

  useEffect(() => {
    const handleGlobalClick = () => {
      setActivePoint(null);
    };
    window.addEventListener('click', handleGlobalClick);

    const now = new Date();
    const checkDate = new Date();
    if (checkDate.getHours() < 7) checkDate.setDate(checkDate.getDate() - 1);

    setTodayLabel(
      checkDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
    );

    let hours = now.getHours() + now.getMinutes() / 60;
    if (hours < 7) hours += 24;
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
        return { bg: 'bg-yellow-100 dark:bg-yellow-700', border: 'border-yellow-500' };
      case 'Bottle':
        return { bg: 'bg-blue-100 dark:bg-blue-800', border: 'border-blue-500' };
      case 'Solid food':
        return { bg: 'bg-green-200 dark:bg-green-700', border: 'border-green-500' };
      default:
        return { bg: 'bg-gray-500', border: 'border-gray-300' };
    }
  };

  // Decide dot size from note text
  const getDotScale = (note?: string): number => {
    if (!note) return 0.9; // default

    const n = note.toLowerCase();
    const largeWords = ['big', 'stor', 'large'];
    const smallWords = ['small', 'lille', 'mellemmåltid', 'snack'];

    const hasLarge = largeWords.some((w) => n.includes(w));
    const hasSmall = smallWords.some((w) => n.includes(w));

    if (hasLarge && !hasSmall) return 1.2; // clearly larger
    if (hasSmall && !hasLarge) return 0.6; // clearly smaller

    return 0.9; // default
  };

  const PORTION_SMALL_LABEL = 'Small portion/Snack';
  const PORTION_BIG_LABEL = 'Big portion';

  const getDisplayNote = (note?: string): string => {
    if (!note) return '';

    // Remove our canonical portion tags
    let clean = note
      .replace(new RegExp(PORTION_SMALL_LABEL, 'gi'), '')
      .replace(new RegExp(PORTION_BIG_LABEL, 'gi'), '')
      .trim();

    return clean;
  };

  const gridMarkers = ['0%', '25%', '50%', '75%', '100%'];

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-slate-700 font-semibold dark:text-slate-300">
          Feeding Schedule{' '}
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            (7.00 - 7.00)
          </span>
        </h3>

        {showHistoryLink && (
          <Link
            href="/feed/history"
            className="text-xs font-medium text-gray-600 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <span>🕙 History</span>
          </Link>
        )}
      </div>

      <div className="relative">
        <div className="space-y-4 mt-2">
          {data.map((day, dIndex) => {
            const isToday = day.date === todayLabel;

            return (
              <div key={dIndex} className="flex items-center gap-3">
                <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                  {day.date}
                </div>

                <div className="flex-1 h-4 bg-slate-300 dark:bg-gray-700 rounded-full relative mt-1">
                  {gridMarkers.map((left) => (
                    <div
                      key={left}
                      className="absolute -top-2 -bottom-2 border-l border-dashed border-gray-200 dark:border-gray-600"
                      style={{ left }}
                    />
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

                  {day.points.map((point, pIndex) => {
                    const style = getStyle(point.type);
                    const isActive =
                      activePoint?.dIndex === dIndex && activePoint?.pIndex === pIndex;

                    const baseSize = 14;
                    const scale = getDotScale(point.note);
                    const size = baseSize * scale;

                    const displayNote = getDisplayNote(point.note);

                    return (
                      <div
                        key={pIndex}
                        onClick={(e) => handlePointClick(e, dIndex, pIndex)}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-all z-10 flex items-center justify-center 
                          ${isActive ? 'scale-125 z-20' : 'hover:scale-110'}
                        `}
                        style={{ left: `${point.left}%` }}
                      >
                        <div
                          className={`
                            rounded-full 
                            shadow-md 
                            ${style.bg} 
                            border-1 ${style.border} dark:border-opacity-50
                          `}
                          style={{ width: size, height: size }}
                        />

                        {isActive && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-30 pointer-events-none">
                            <p className="font-bold">{point.time}</p>
                            <p className="text-[10px] opacity-80">{point.type}</p>

                            {displayNote && (
                              <p className="text-[10px] mt-1 opacity-90 max-w-[220px] whitespace-pre-line break-words">
                                {displayNote}
                              </p>
                            )}

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