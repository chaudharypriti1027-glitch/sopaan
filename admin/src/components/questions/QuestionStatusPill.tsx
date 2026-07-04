import type { AdminQuestion } from '../../api/questionTypes';

export function QuestionStatusPill({ question }: { question: AdminQuestion }) {
  if (question.status === 'published') {
    return <span className="pill q-pub">Published</span>;
  }
  if (question.reviewStatus === 'pending') {
    return <span className="pill q-rev">In review</span>;
  }
  return <span className="pill q-draft">Draft</span>;
}

export function ReviewIssuePill({ message }: { message: string }) {
  return <span className="pill q-rev">{message}</span>;
}
