import { PagePlaceholder } from '../components/PagePlaceholder';

export function StubPage({ title }: { title: string }) {
  return <PagePlaceholder title={title} />;
}
