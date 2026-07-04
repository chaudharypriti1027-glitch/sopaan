import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCountUp } from '../../hooks/useCountUp';
import './dashboard.css';

type PriorityTone = 'gold' | 'sage' | 'navy';

interface PriorityCardProps {
  tone: PriorityTone;
  count: number;
  label: string;
  cta: string;
  to: string;
  icon: ReactNode;
  animate?: boolean;
}

export function PriorityCard({
  tone,
  count,
  label,
  cta,
  to,
  icon,
  animate = true,
}: PriorityCardProps) {
  const display = useCountUp(count, { enabled: animate });

  return (
    <div className={`pc ${tone === 'gold' ? 'a' : tone === 'sage' ? 'b' : 'c'}`}>
      <div className="h">
        <div className="ic">{icon}</div>
        <div className="t">
          <b className="num">{display}</b>
          <span>{label}</span>
        </div>
      </div>
      <Link className="go" to={to}>
        {cta}
        <svg className="svg" viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
