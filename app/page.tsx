export default function Home() {
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Baby Tracker</h1>
        <span className="text-sm text-gray-500">Oct 26</span>
      </header>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-colors">
          <span className="text-2xl">😴</span>
          <span className="font-semibold">Sleep</span>
        </button>
        
        <button className="bg-pink-600 hover:bg-pink-700 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-colors">
          <span className="text-2xl">🍼</span>
          <span className="font-semibold">Feed</span>
        </button>

        <button className="bg-yellow-600 hover:bg-yellow-700 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-colors">
          <span className="text-2xl">💩</span>
          <span className="font-semibold">Diaper</span>
        </button>

        <button className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-colors">
          <span className="text-xl">➕</span>
          <span className="font-semibold">More</span>
        </button>
      </section>

      {/* Recent Activity Log (Placeholder) */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Recent Activity</h2>
        
        <div className="space-y-3">
          {/* Dummy Event 1 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full text-lg">😴</span>
              <div>
                <p className="font-medium">Sleep</p>
                <p className="text-xs text-gray-500">1h 20m</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">10:30 AM</span>
          </div>

          {/* Dummy Event 2 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-pink-100 dark:bg-pink-900 p-2 rounded-full text-lg">🍼</span>
              <div>
                <p className="font-medium">Feed</p>
                <p className="text-xs text-gray-500">120ml (Formula)</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">09:00 AM</span>
          </div>
        </div>
      </section>
    </main>
  );
}