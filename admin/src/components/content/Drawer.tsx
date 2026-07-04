import type { ReactNode } from 'react';
import { ActionButton } from '../ActionButton';
import '../ui.css';

interface DrawerProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitting?: boolean;
  footerExtra?: ReactNode;
}

export function Drawer({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  submitting,
  footerExtra,
}: DrawerProps) {
  if (!open) return null;

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <h2 id="drawer-title">{title}</h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <svg className="svg" viewBox="0 0 24 24" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        <footer className="drawer-foot">
          {footerExtra}
          <ActionButton variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </ActionButton>
          {onSubmit ? (
            <ActionButton variant="gold" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </ActionButton>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}
