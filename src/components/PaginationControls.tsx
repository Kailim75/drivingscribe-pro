import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PAGE_SIZE = 25;

interface PaginationControlsProps {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

export function usePagination<T>(items: T[], page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.ceil(items.length / pageSize);
  const paginated = items.slice((page - 1) * pageSize, page * pageSize);
  return { paginated, totalPages, total: items.length };
}

export function PaginationControls({ page, total, pageSize = DEFAULT_PAGE_SIZE, onChange }: PaginationControlsProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
      <span className="text-muted-foreground">
        {total} résultat{total > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
