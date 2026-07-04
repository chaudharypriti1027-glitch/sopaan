import { useCountUp } from '../../hooks/useCountUp';
import './dashboard.css';

interface ContentMixDonutProps {
  questions: number;
  affairs: number;
  courses: number;
  animate?: boolean;
}

export function ContentMixDonut({ questions, affairs, courses, animate = true }: ContentMixDonutProps) {
  const total = questions + affairs + courses;
  const displayTotal = useCountUp(total, { enabled: animate });

  if (total === 0) {
    return (
      <div className="donut-wrap">
        <div className="donut donut-empty">
          <div className="c">
            <span className="v num">0</span>
            <span className="l">items</span>
          </div>
        </div>
        <div className="dleg">
          <div className="lr">
            <span className="sw" style={{ background: 'var(--navy)' }} />
            Questions<span className="p num">0</span>
          </div>
          <div className="lr">
            <span className="sw" style={{ background: 'var(--gold)' }} />
            Affairs<span className="p num">0</span>
          </div>
          <div className="lr">
            <span className="sw" style={{ background: 'var(--sage)' }} />
            Courses<span className="p num">0</span>
          </div>
        </div>
      </div>
    );
  }

  const qPct = (questions / total) * 100;
  const aPct = (affairs / total) * 100;
  const gradient = `conic-gradient(var(--navy) 0 ${qPct}%, var(--gold) ${qPct}% ${qPct + aPct}%, var(--sage) ${qPct + aPct}% 100%)`;

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: gradient }}>
        <div className="c">
          <span className="v num">{displayTotal}</span>
          <span className="l">items</span>
        </div>
      </div>
      <div className="dleg">
        <div className="lr">
          <span className="sw" style={{ background: 'var(--navy)' }} />
          Questions<span className="p num">{questions.toLocaleString()}</span>
        </div>
        <div className="lr">
          <span className="sw" style={{ background: 'var(--gold)' }} />
          Affairs<span className="p num">{affairs.toLocaleString()}</span>
        </div>
        <div className="lr">
          <span className="sw" style={{ background: 'var(--sage)' }} />
          Courses<span className="p num">{courses.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
