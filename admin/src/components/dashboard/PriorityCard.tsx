import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
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
        <ArrowRight aria-hidden strokeWidth={1.8} />
      </Link>
    </div>
  );
}
