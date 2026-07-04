import type { ReactNode } from 'react';
import './ui.css';

type Variant = 'gold' | 'ghost' | 'navy' | 'red';

interface ActionButtonProps {
  children: ReactNode;
  variant?: Variant;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function ActionButton({
  children,
  variant = 'ghost',
  onClick,
  type = 'button',
  disabled,
}: ActionButtonProps) {
  return (
    <button type={type} className={`tbtn ${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
