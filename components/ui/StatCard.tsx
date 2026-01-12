// components/ui/StatCard.tsx
import { ReactNode } from 'react';

type ColorVariant = 'indigo' | 'blue' | 'purple' | 'fuchsia' | 'green' | 'yellow' | 'orange' | 'violet' | 'red' | 'amber' | 'emerald' | 'sky' | 'cyan';

interface StatCardProps {
  label: string;
  value: string | number | ReactNode;
  icon?: string; // Optional emoji/icon
  color?: ColorVariant;
}

const colorStyles: Record<ColorVariant, { bg: string; text: string; label: string }> = {
  indigo:  { bg: 'bg-indigo-200 dark:bg-indigo-900',  text: 'text-indigo-900 dark:text-indigo-200', label: 'text-indigo-900 dark:text-indigo-200' },
  blue:    { bg: 'bg-blue-200 dark:bg-blue-900',      text: 'text-blue-900 dark:text-blue-200',    label: 'text-blue-900 dark:text-blue-200' },
  purple:  { bg: 'bg-purple-200 dark:bg-purple-900',  text: 'text-purple-900 dark:text-purple-200', label: 'text-purple-900 dark:text-purple-200' },
  fuchsia: { bg: 'bg-fuchsia-200 dark:bg-fuchsia-900', text: 'text-fuchsia-900 dark:text-fuchsia-200', label: 'text-fuchsia-900 dark:text-fuchsia-200' },
  green:   { bg: 'bg-green-200 dark:bg-green-900',    text: 'text-green-900 dark:text-green-200',  label: 'text-green-900 dark:text-green-200' },
  yellow:  { bg: 'bg-yellow-200 dark:bg-yellow-900',  text: 'text-yellow-900 dark:text-yellow-200', label: 'text-yellow-900 dark:text-yellow-200' },
  orange:  { bg: 'bg-orange-200 dark:bg-orange-900',  text: 'text-orange-900 dark:text-orange-200', label: 'text-orange-900 dark:text-orange-200' },
  amber:    { bg: 'bg-amber-200 dark:bg-amber-900',  text: 'text-amber-900 dark:text-amber-200',     label: 'text-amber-900 dark:text-amber-200' },
  violet:   { bg: 'bg-violet-200 dark:bg-violet-900',      text: 'text-violet-900 dark:text-violet-200',    label: 'text-violet-900 dark:text-violet-200' },
  cyan:    { bg: 'bg-cyan-100 dark:bg-cyan-900',      text: 'text-cyan-900 dark:text-cyan-200',    label: 'text-cyan-900 dark:text-cyan-200' },
  red:    { bg: 'bg-red-200 dark:bg-red-900',      text: 'text-red-900 dark:text-red-200',    label: 'text-red-900 dark:text-red-200' },
  sky:    { bg: 'bg-sky-200 dark:bg-sky-900',      text: 'text-sky-900 dark:text-sky-200',    label: 'text-sky-900 dark:text-sky-200' },
  emerald:    { bg: 'bg-emerald-200 dark:bg-emerald-900',      text: 'text-emerald-900 dark:text-emerald-200',    label: 'text-emerald-900 dark:text-emerald-200' },
};

export default function StatCard({ label, value, icon, color = 'indigo' }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div className={`${styles.bg} px-4 py-2 rounded-xl`}> {/* 👈 Centralized Padding Here */}
      <p className={`${styles.label} text-sm`}>{label}</p>
      
      <div className="flex items-baseline gap-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <p className={`text-2xl font-bold ${styles.text}`}>
          {value}
        </p>
      </div>
    </div>
  );
}