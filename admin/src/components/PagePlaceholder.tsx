import type { ReactNode } from 'react';

export function PagePlaceholder({
  title,
  children,
  description = 'This section is not available yet. Wired areas of the console remain available from the sidebar.',
}: {
  title: string;
  children?: ReactNode;
  description?: string;
}) {
  return (
    <div className="coming-soon" role="status">
      <span className="coming-soon-eyebrow">Coming soon</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
