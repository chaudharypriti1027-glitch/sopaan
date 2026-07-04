export interface NavItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
  live?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [{ id: 'dashboard', label: 'Dashboard', path: '/' }],
  },
  {
    title: 'CONTENT',
    items: [
      { id: 'questions', label: 'Questions', path: '/questions', badge: '—' },
      { id: 'review', label: 'Review queue', path: '/review', badge: '—' },
      { id: 'tests', label: 'Tests & moderation', path: '/tests', badge: '—' },
      { id: 'exams', label: 'Exams', path: '/exams' },
      { id: 'courses', label: 'Courses', path: '/courses' },
      { id: 'affairs', label: 'Current affairs', path: '/affairs' },
      { id: 'media', label: 'Media library', path: '/media' },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { id: 'students', label: 'Students', path: '/students' },
      { id: 'mentors', label: 'Mentors', path: '/mentors' },
      { id: 'live', label: 'Live classes', path: '/live', live: true },
    ],
  },
  {
    title: 'ENGAGE',
    items: [
      { id: 'push', label: 'Notifications', path: '/notifications' },
      { id: 'announce', label: 'Announcements', path: '/announcements' },
      { id: 'coupons', label: 'Coupons & offers', path: '/coupons' },
    ],
  },
  {
    title: 'REVENUE',
    items: [{ id: 'revenue', label: 'Payments & revenue', path: '/revenue' }],
  },
  {
    title: 'AUTOMATION',
    items: [
      { id: 'aifeedback', label: 'AI feedback', path: '/ai-feedback', badge: '—' },
      { id: 'jobs', label: 'Jobs & automation', path: '/jobs' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'roles', label: 'Roles & access', path: '/roles' },
      { id: 'settings', label: 'Settings', path: '/settings' },
    ],
  },
];

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((item) => [item.path === '/' ? '/' : item.path, item.label])),
);
