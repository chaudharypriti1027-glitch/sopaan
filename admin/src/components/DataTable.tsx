import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { QueryErrorBanner } from './QueryErrorBanner';
import { ADMIN_SHELL_COPY } from '../content/adminShellContent';
import './ui.css';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  emptyHint?: string;
  error?: unknown;
  onRetry?: () => void;
  isLoading?: boolean;
}

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  emptyMessage = 'No rows yet',
  emptyHint,
  error,
  onRetry,
  isLoading = false,
}: DataTableProps<T>) {
  if (error) {
    return <QueryErrorBanner error={error} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div className="table-wrap table-state" role="status" aria-live="polite">
        <p className="table-empty">{ADMIN_SHELL_COPY.loading}</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="table-wrap table-state">
        <div className="table-empty-block">
          <div className="empty-icon" aria-hidden>
            <Inbox strokeWidth={1.7} />
          </div>
          <p className="table-empty">{emptyMessage}</p>
          {emptyHint ? <p className="table-empty-hint">{emptyHint}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id ?? String(idx)}>
              {columns.map((col) => (
                <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
