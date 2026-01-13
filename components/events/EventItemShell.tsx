'use client';

import { ReactNode } from 'react';

type Props = {
  icon: string;       
  colorTheme: string; // 'blue' | 'cyan' | 'orange' | 'green'
  title: string;
  subText?: string | ReactNode;
  rightTop?: string | ReactNode;
  rightBottom?: string | ReactNode;
  onClick: () => void;
};

export default function EventItemShell({
  icon,
  colorTheme,
  title,
  subText,
  rightTop,
  rightBottom,
  onClick
}: Props) {

  // 1. Define the themes map explicitly
  const themes: Record<string, { iconBg: string }> = {
    blue:   { iconBg: 'bg-indigo-100 dark:bg-indigo-900' },
    cyan:   { iconBg: 'bg-cyan-100 dark:bg-cyan-900' },
    orange: { iconBg: 'bg-orange-100 dark:bg-orange-900' },
    green:  { iconBg: 'bg-green-100 dark:bg-green-900' },
    rose:   { iconBg: 'bg-rose-100 dark:bg-rose-900' },
    slate:  { iconBg: 'bg-slate-200 dark:bg-slate-700' },
  };

  // 2. Select the theme (Fall back to blue if colorTheme is invalid)
  const currentTheme = themes[colorTheme] || themes.blue;

  return (
    <div 
      // 👇 DEBUGGING LOGIC ADDED HERE
      onClick={() => {
        console.log("SHELL CLICKED!"); // Look for this in your browser console (F12)
        onClick(); // Run the actual function
      }}
      className="bg-sky-50 dark:bg-sky-950 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:opacity-90 transition-opacity mb-2"
    >
      {/* LEFT SIDE: Icon + Title/Subtext */}
      <div className="flex items-center gap-3 overflow-hidden">
        <span className={`${currentTheme.iconBg} p-2 rounded-full text-xl flex-shrink-0`}>
          {icon}
        </span>
        
        <div className="min-w-0">
          <p className={`font-medium text-slate-800 dark:text-slate-200`}>
            {title}
          </p>
          {subText && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {subText}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Top/Bottom Info */}
      <div className="text-right flex-shrink-0 ml-2">
        {rightTop && (
          <p className="text-sm text-slate-800 dark:text-slate-200">
            {rightTop}
          </p>
        )}
        {rightBottom && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {rightBottom}
          </p>
        )}
      </div>
    </div>
  );
}