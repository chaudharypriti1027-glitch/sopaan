import type { ReactNode } from 'react';
import './ui.css';

interface PillProps {
  children: ReactNode;
  tone?: 'gold' | 'sage' | 'navy' | 'red' | 'muted';
}

export function Pill({ children, tone = 'muted' }: PillProps) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
