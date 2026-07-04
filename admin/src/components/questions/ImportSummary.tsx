import type { QuestionImportResult } from '../../api/questionTypes';

export function ImportSummary({ result }: { result: QuestionImportResult }) {
  return (
    <div className="import-summary panel">
      <h3>Import result</h3>
      <div className="import-stats">
        <div>
          <b className="num">{result.insertedCount}</b>
          <span>Inserted</span>
        </div>
        <div>
          <b className="num">{result.errorCount}</b>
          <span>Failed</span>
        </div>
        <div>
          <b className="num">{result.pendingReviewCount}</b>
          <span>Pending review</span>
        </div>
        <div>
          <b className="num">{result.totalRows}</b>
          <span>Total rows</span>
        </div>
      </div>
      {result.errors.length > 0 ? (
        <ul className="import-errors">
          {result.errors.slice(0, 8).map((row) => (
            <li key={row.row}>
              Row {row.row}: {row.errors.map((e) => e.message).join(', ')}
            </li>
          ))}
          {result.errors.length > 8 ? (
            <li>…and {result.errors.length - 8} more row errors</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
