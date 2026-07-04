import type { PublishStatus } from '../../api/contentTypes';

export function PublishStatusPill({ status }: { status: PublishStatus }) {
  if (status === 'published') {
    return <span className="pill q-pub">Published</span>;
  }
  return <span className="pill q-draft">Draft</span>;
}
