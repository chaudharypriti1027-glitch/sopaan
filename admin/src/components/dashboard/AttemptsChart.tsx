import type { DailySeriesPoint } from '../../api/types';
import './dashboard.css';

interface AttemptsChartProps {
  series: DailySeriesPoint[];
}

export function AttemptsChart({ series }: AttemptsChartProps) {
  const max = Math.max(...series.map((point) => point.value), 1);

  return (
    <div className="chart">
      {series.map((point, index) => {
        const height = Math.max((point.value / max) * 100, point.value > 0 ? 8 : 0);
        return (
          <div className="bar" key={point.date}>
            <i
              style={{
                height: `${height}%`,
                animationDelay: `${index * 45}ms`,
              }}
            />
            <span>{point.label.charAt(0)}</span>
          </div>
        );
      })}
    </div>
  );
}
