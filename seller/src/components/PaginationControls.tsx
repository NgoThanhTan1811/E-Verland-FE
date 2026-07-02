import { useState, useEffect } from "react";

interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  itemName?: string;
}

export function PaginationControls({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  itemName = "items",
}: PaginationControlsProps) {
  const [inputValue, setInputValue] = useState(page.toString());
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    setInputValue(page.toString());
  }, [page]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let val = parseInt(inputValue, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
    } else if (val > totalPages) {
      val = totalPages;
    }
    setInputValue(val.toString());
    if (val !== page) {
      onPageChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} {itemName}
        </div>
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm text-gray-700 dark:text-gray-300"
        >
          Previous
        </button>

        <div className="flex items-center gap-2 px-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-12 px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            of {totalPages}
          </span>
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm text-gray-700 dark:text-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
