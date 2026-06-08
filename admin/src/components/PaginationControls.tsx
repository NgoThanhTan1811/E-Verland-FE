import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export function PaginationControls({ page, limit, total, onPageChange, itemName = "items" }: PaginationControlsProps) {
  const { t } = useLanguage();
  const totalPages = Math.ceil(total / limit) || 1;
  const [inputValue, setInputValue] = useState(page.toString());

  useEffect(() => {
    setInputValue(page.toString());
  }, [page]);

  if (total <= 0) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t.common.showing} {Math.min((page - 1) * limit + 1, total)} {t.common.to}{" "}
        {Math.min(page * limit, total)} {t.common.of} {total} {itemName}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t.common.previous}
        </button>

        <div className="flex items-center gap-2 px-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => {
              let val = parseInt(inputValue);
              if (isNaN(val) || val < 1) val = 1;
              if (val > totalPages) val = totalPages;
              setInputValue(val.toString());
              if (val !== page) onPageChange(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                let val = parseInt(inputValue);
                if (isNaN(val) || val < 1) val = 1;
                if (val > totalPages) val = totalPages;
                setInputValue(val.toString());
                if (val !== page) onPageChange(val);
              }
            }}
            className="w-16 px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            of {totalPages}
          </span>
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t.common.next}
        </button>
      </div>
    </div>
  );
}
