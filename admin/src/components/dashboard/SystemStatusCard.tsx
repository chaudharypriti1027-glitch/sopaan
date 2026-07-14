import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchSystemCheck } from '../../api/systemCheck';
import { getApiOrigin } from '../../realtime/socketOrigin';
import './system-status.css';

export function SystemStatusCard() {
  const query = useQuery({
    queryKey: ['admin', 'system-check'],
    queryFn: fetchSystemCheck,
    refetchInterval: 60_000,
  });

  const data = query.data;
  const apiOrigin = getApiOrigin() || data?.apiOrigin || '—';

  return (
    <section className="panel system-status">
      <div className="system-status-head">
        <div>
          <h3>System check</h3>
          <p className="page-sub">
            API connection, database, uploads, and student content pipeline
          </p>
        </div>
        <span className={`pill ${data?.allOk ? 'p-pub' : 'p-draft'}`}>
          {query.isLoading ? 'Checking…' : data?.allOk ? 'All OK' : 'Needs attention'}
        </span>
      </div>

      <div className="system-status-meta">
        <span>API: {apiOrigin || 'same origin (proxy)'}</span>
        {data?.assessedAt ? (
          <span>Checked {new Date(data.assessedAt).toLocaleTimeString()}</span>
        ) : null}
      </div>

      {query.isError ? (
        <p className="system-status-error">Could not reach the API. Start the server on port 4000.</p>
      ) : (
        <ul className="system-check-list">
          {(data?.checks ?? []).map((check) => (
            <li key={check.id} className={`system-check-row${check.ok ? ' ok' : ' warn'}`}>
              <span className="system-check-dot" aria-hidden />
              <div>
                <b>{check.label}</b>
                <div className="page-sub">{check.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data ? (
        <div className="system-content-grid">
          <div className="system-content-stat">
            <b>{data.content.coursesPublished}</b>
            <span>Published courses</span>
            {data.content.coursesDraft > 0 ? (
              <Link to="/courses" className="system-draft-link">
                {data.content.coursesDraft} draft
              </Link>
            ) : null}
          </div>
          <div className="system-content-stat">
            <b>{data.content.affairsPublished}</b>
            <span>Published affairs</span>
            {data.content.affairsDraft > 0 ? (
              <Link to="/affairs" className="system-draft-link">
                {data.content.affairsDraft} draft
              </Link>
            ) : null}
          </div>
          <div className="system-content-stat">
            <b>{data.content.mediaTotal}</b>
            <span>Media files</span>
            <Link to="/media" className="system-draft-link">
              Open library
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
