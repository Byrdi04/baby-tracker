// In app/import/page.tsx
"use client";

import { useState, type ChangeEvent } from 'react';

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first.');
      return;
    }
    setIsUploading(true);
    setUploadStatus('Uploading and processing...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setUploadStatus(`Success! ${result.message}`);
      } else {
        throw new Error(result.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // --- NEW: Function to download the CSV template ---
  const handleDownloadTemplate = () => {
    // We will build the CSV row by row to ensure proper quoting
    const headers = ["type", "startTime", "endTime", "value", "note"];
    const rows = [
      ["WEIGHT", "09/06/2025", "", "5250", ""],
      ["WEIGHT", "01/06/2025", "", "5100", ""],
      ["FEED", "2025-06-09T14:30:00Z", "", "150", ""],
      ["SLEEP", "2025-06-09T20:00:00Z", "2025-06-10T06:30:00Z", "", ""],
      ["DIAPER", "10-06-2025", "", "", "Wet and poopy"],
    ];

    // Function to wrap each field in quotes and join with commas
    const toCsvRow = (arr: string[]) => arr.map(field => `"${field}"`).join(',');

    // Create the full CSV content
    let csvContent = toCsvRow(headers) + "\r\n"; // Add headers
    rows.forEach(row => {
      csvContent += toCsvRow(row) + "\r\n"; // Add each data row
    });

    // The rest of the download logic remains the same
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
      <code>{children}</code>
    </pre>
  );

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">📄 CSV Data Import</h1>
        <p className="text-gray-500 text-sm">Bulk upload event data.</p>
      </header>

      {/* Uploader UI */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        {/* ... (Your existing uploader JSX) ... */}
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select CSV File
          </label>
          <div className="mt-1">
            <input id="file-upload" name="file-upload" type="file" accept=".csv" onChange={handleFileChange} className="..." />
          </div>
        </div>
        <button onClick={handleUpload} disabled={isUploading || !selectedFile} className="...">
          {isUploading ? 'Processing...' : 'Upload and Import'}
        </button>
        {uploadStatus && (
          <div className="mt-4 p-3 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <p><strong>Status:</strong> {uploadStatus}</p>
          </div>
        )}
      </div>

      {/* --- UPDATED INSTRUCTIONS SECTION --- */}
      <section className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            Instructions & Formatting Guide
          </h2>
          {/* NEW: Download Template Button */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download Template
          </button>
        </div>
        
        <p className="mb-4">
          Your CSV file must have a header row. The backend is smart and can handle flexible date formats and simple values.
        </p>

        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Columns:</h3>
        <ul className="list-disc list-inside space-y-2 my-2">
          <li><strong>type</strong> (Required): The event type. Must be one of: <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">SLEEP</code>, <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">FEED</code>, <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">DIAPER</code>, <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">WEIGHT</code>.</li>
          <li><strong>startTime</strong> (Required): The date/time of the event. Flexible formats like <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">DD/MM/YY</code>, <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">YYYY-MM-DD</code>, or full ISO strings are accepted.</li>
          <li><strong>endTime</strong> (Optional): The end time for `SLEEP` events. Same flexible date format.</li>
          <li><strong>value</strong> (Optional): A simple number for specific events.
            <ul className="list-['-_'] list-inside ml-4 mt-1 text-xs">
              <li>For `WEIGHT`: The weight in **grams** (e.g., `5250`).</li>
              <li>For `FEED`: The volume in **ml** (e.g., `150`).</li>
            </ul>
          </li>
          <li><strong>note</strong> (Optional): Any text notes for the event.</li>
        </ul>

        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mt-4">Example CSV Content:</h3>
        <p className="text-xs mb-2">Your CSV file should look like this. The `value` column is used differently depending on the `type` Note is optional.</p>

        <CodeBlock>
{`type,startTime,endTime,value,note
WEIGHT,09/06/25,,"5250",Morning weigh-in
WEIGHT,01/06/25,,"5150",Morning weigh-in
FEED,2025-06-09T14:30:00Z,,"150",Formula
SLEEP,2025-06-09T20:00:00Z,2025-06-10T06:30:00Z,,"Started night sleep"
DIAPER,10-06-25,,,"Wet and poopy"`}
        </CodeBlock>
      </section>
    </main>
  );
}