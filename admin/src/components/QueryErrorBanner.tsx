import { ADMIN_SHELL_COPY } from '../content/adminShellContent';
import { formatApiError } from '../api/errors';
import './query-error.css';

type QueryErrorBannerProps = {
  title?: string;
  error: unknown;
  onRetry?: () => void;
};

export function QueryErrorBanner({
  title = ADMIN_SHELL_COPY.queryErrorTitle,
  error,
  onRetry,
}: QueryErrorBannerProps) {
  return (
    <div className="query-error" role="alert">
      <div className="query-error-copy">
        <strong>{title}</strong>
        <p>{formatApiError(error)}</p>
        <span className="query-error-hint">{ADMIN_SHELL_COPY.queryErrorHint}</span>
      </div>
      {onRetry ? (
        <button type="button" className="query-error-retry" onClick={onRetry}>
          {ADMIN_SHELL_COPY.retry}
        </button>
      ) : null}
    </div>
  );
}
