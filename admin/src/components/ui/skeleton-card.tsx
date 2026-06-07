export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        <div className="flex items-end gap-2 h-64">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-t"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            ></div>
          ))}
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
