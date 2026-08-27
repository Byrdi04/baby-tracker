'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLink() {
  const pathname = usePathname();

  // Don't show the settings link when already on the settings page
  if (pathname === '/settings') return null;

  return (
    <Link
      href="/settings"
      className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      aria-label="Settings"
    >
      <span className="text-xl">⚙️</span>
    </Link>
  );
}