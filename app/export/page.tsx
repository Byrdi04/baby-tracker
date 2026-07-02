// app/export/page.tsx
"use client";

import { useState } from 'react';

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create an invisible link to trigger the browser's download prompt
      const link = document.createElement("a");
      link.href = "/api/export";
      link.setAttribute("download", "baby_tracker_backup.csv"); // Fallback name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please check the server logs.");
    } finally {
      // Small delay to allow the download to start before resetting the button
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">📤 CSV Data Export</h1>
        <p className="text-gray-500 text-sm">Download a full backup of your tracked data.</p>
      </header>

      {/* Export UI */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Backup Your Database
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click the button below to generate a `.csv` file containing all of your sleep, feed, diaper, and weight logs. 
          </p>
        </div>

        <button 
          onClick={handleExport} 
          disabled={isExporting} 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
        >
          {isExporting ? 'Generating file...' : 'Download Full Backup'}
        </button>

      </div>

      {/* Instructions Section */}
      <section className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
          How Bidirectional Sync Works
        </h2>
        
        <p className="mb-4">
          This export file is designed to be <strong>100% compatible</strong> with the Import page on another device.
        </p>

        <ul className="list-disc list-inside space-y-2">
          <li><strong>No data loss:</strong> The export includes the exact JSON <code>data</code> column used by the database behind the scenes.</li>
          <li><strong>Easy transfers:</strong> Simply download this file, transfer it to a new device, and upload it on the Import page. The backend importer will automatically read the raw JSON and restore your data exactly as it was.</li>
          <li><strong>Excel editing:</strong> You can open this file in Excel to edit timestamps or notes. Just be careful not to delete or modify the raw JSON in the <code>data</code> column!</li>
        </ul>
      </section>
    </main>
  );
}