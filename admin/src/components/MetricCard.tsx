import type { ReactNode } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import './ui.css';

type Tone = 'navy' | 'gold' | 'sage';

interface MetricCardProps {
  label: string;
  value: number;
  tone?: Tone;
  trend?: string;
  icon?: ReactNode;
  animate?: boolean;
}

export function MetricCard({
  label,
  value,
  tone = 'navy',
  trend,
  icon,
  animate = true,
}: MetricCardProps) {
  const display = useCountUp(value, { enabled: animate });

  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-top">
        {icon ? <div className={`metric-icon i-${tone}`}>{icon}</div> : null}
        {trend ? <span className="metric-trend up">{trend}</span> : null}
      </div>
      <div className="metric-value num">{display}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
