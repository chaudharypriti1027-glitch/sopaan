interface PaginationBarProps {
  offset: number;
  limit: number;
  total: number;
  onPageChange: (offset: number) => void;
}

export function PaginationBar({ offset, limit, total, onPageChange }: PaginationBarProps) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="pager">
      <span className="pager-meta">
        Page {page} of {totalPages} · {total.toLocaleString()} total
      </span>
      <div className="pager-actions">
        <button
          type="button"
          className="tbtn ghost"
          disabled={offset <= 0}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
        >
          Previous
        </button>
        <button
          type="button"
          className="tbtn ghost"
          disabled={offset + limit >= total}
          onClick={() => onPageChange(offset + limit)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
