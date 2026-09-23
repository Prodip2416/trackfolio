export default function ShortTermLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-tl-2xl border-t border-l border-gray-200 dark:border-gray-800 transition-colors">
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-2 animate-pulse">
              <div className="h-7 w-40 bg-gray-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-48 bg-gray-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>

          {/* Cards / Tabs skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>

          {/* List skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse"
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
