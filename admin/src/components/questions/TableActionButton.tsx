import type { ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'ok' | 'danger';

interface TableActionButtonProps {
  children: ReactNode;
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
}

export function TableActionButton({
  children,
  variant = 'default',
  onClick,
  disabled,
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      className={`abtn${variant === 'primary' ? ' pri' : ''}${variant === 'ok' ? ' ok' : ''}${variant === 'danger' ? ' no' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
