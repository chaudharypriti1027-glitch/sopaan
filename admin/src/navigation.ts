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
      { id: 'questions', label: 'Questions', path: '/questions' },
      { id: 'review', label: 'Review queue', path: '/review' },
      { id: 'tests', label: 'Tests & moderation', path: '/tests' },
      { id: 'exams', label: 'Exams', path: '/exams' },
      { id: 'courses', label: 'Courses', path: '/courses' },
      { id: 'affairs', label: 'Current affairs', path: '/affairs' },
      { id: 'books', label: 'AI books', path: '/books' },
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
      { id: 'aifeedback', label: 'AI feedback', path: '/ai-feedback' },
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

export const PAGE_GROUPS: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((item) => [item.path === '/' ? '/' : item.path, g.title])),
);

export const PAGE_SUBTITLES: Record<string, string> = {
  '/': 'Overview of students, content, and platform health',
  '/questions': 'Create and manage the question bank',
  '/review': 'Approve or reject submitted questions',
  '/tests': 'Moderate practice tests and mock exams',
  '/exams': 'Configure target exams and categories',
  '/courses': 'Build courses with video lessons and notes',
  '/affairs': 'Publish current affairs for student prep',
  '/books': 'Generate and publish AI study books',
  '/media': 'Upload and organize images and videos',
  '/students': 'View learner profiles and activity',
  '/mentors': 'Manage mentor profiles and availability',
  '/live': 'Schedule and host live classes',
  '/notifications': 'Send push and in-app notifications',
  '/announcements': 'Home banners and announcements',
  '/coupons': 'Offers, coupons, and promotions',
  '/revenue': 'Payments, subscriptions, and refunds',
  '/ai-feedback': 'Review flagged AI evaluations',
  '/jobs': 'Background jobs and automation',
  '/roles': 'Team invites and role access',
  '/settings': 'Platform configuration and preferences',
};
