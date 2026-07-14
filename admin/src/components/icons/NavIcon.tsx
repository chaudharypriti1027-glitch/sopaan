import type { ReactNode } from 'react';

type NavIconProps = {
  id: string;
};

function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg className="svg" viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  questions: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
    </>
  ),
  review: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  tests: (
    <>
      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  exams: (
    <>
      <path d="M22 10 12 5 2 10l10 5z" />
      <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
    </>
  ),
  courses: (
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
  ),
  affairs: (
    <>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 8h3v9a2 2 0 0 1-2 2M8 9h5M8 13h5" />
    </>
  ),
  books: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      <path d="M12 7v10" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  students: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3.5 3.5 0 0 1 0 6M18 20a6 6 0 0 0-3-5" />
    </>
  ),
  mentors: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0M12 12v3" />
    </>
  ),
  live: (
    <>
      <rect x="2" y="5" width="14" height="14" rx="3" />
      <path d="m22 8-6 4 6 4z" />
    </>
  ),
  push: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  announce: (
    <>
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  coupons: (
    <>
      <path d="M9 4H5a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h4M9 4h10a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H9M9 4v16" />
    </>
  ),
  revenue: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 14 3-3 3 3 5-6" />
    </>
  ),
  aifeedback: <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />,
  jobs: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  roles: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 3.5a3.5 3.5 0 0 1 0 9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82 2 2 0 1 1-2.83 2.83 1.65 1.65 0 0 0-2.82 1.17 2 2 0 1 1-4 0A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33 2 2 0 1 1-2.83-2.83A1.65 1.65 0 0 0 3.6 14 2 2 0 1 1 3.6 10 1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82 2 2 0 1 1 2.83-2.83A1.65 1.65 0 0 0 10 4.6 2 2 0 1 1 14 4.6a1.65 1.65 0 0 0 2.82 1.17 2 2 0 1 1 2.83 2.83A1.65 1.65 0 0 0 19.4 10 2 2 0 1 1 19.4 14z" />
    </>
  ),
};

export function NavIcon({ id }: NavIconProps) {
  return <IconSvg>{ICONS[id] ?? <circle cx="12" cy="12" r="9" />}</IconSvg>;
}

export function LogOutIcon() {
  return (
    <IconSvg>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </IconSvg>
  );
}
