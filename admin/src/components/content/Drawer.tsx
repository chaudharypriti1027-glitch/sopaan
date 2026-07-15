import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import '../ui.css';

interface DrawerProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: 'default' | 'wide';
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
  size = 'default',
  onSubmit,
  submitLabel = 'Save',
  submitting,
  footerExtra,
}: DrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, submitting]);

  if (!open) return null;

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className={`drawer${size === 'wide' ? ' drawer-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <h2 id={titleId}>{title}</h2>
          <button
            ref={closeRef}
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
            disabled={submitting}
          >
            <X aria-hidden strokeWidth={1.8} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        <footer className="drawer-foot">
          {footerExtra ? <div className="drawer-foot-start">{footerExtra}</div> : null}
          <div className="drawer-foot-end">
            <ActionButton variant="ghost" onClick={onClose} disabled={submitting}>
              {onSubmit ? 'Cancel' : 'Close'}
            </ActionButton>
            {onSubmit ? (
              <ActionButton variant="gold" onClick={onSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : submitLabel}
              </ActionButton>
            ) : null}
          </div>
        </footer>
      </aside>
    </div>
  );
}
