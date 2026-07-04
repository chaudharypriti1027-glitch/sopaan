import type { ReactNode } from 'react';

export function PagePlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <h2 className="page-title">{title}</h2>
      <p className="page-sub">Sopaan admin console — wired to live APIs.</p>
      {children}
    </div>
  );
}
