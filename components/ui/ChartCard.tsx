// components/ui/ChartCard.tsx
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string; // Allow extra styling if needed
}

export default function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    // 👈 Centralized Chart Styles
    <div className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}