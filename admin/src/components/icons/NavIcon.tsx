import {
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Images,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Megaphone,
  Newspaper,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

type NavIconProps = {
  id: string;
};

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  questions: CircleHelp,
  review: FileCheck2,
  tests: ClipboardCheck,
  exams: GraduationCap,
  courses: LibraryBig,
  affairs: Newspaper,
  books: BookOpen,
  media: Images,
  students: UsersRound,
  mentors: UserRoundCheck,
  live: Radio,
  push: Bell,
  announce: Megaphone,
  coupons: Tags,
  revenue: ChartNoAxesCombined,
  aifeedback: Sparkles,
  jobs: BriefcaseBusiness,
  roles: ShieldCheck,
  settings: Settings,
};

export function NavIcon({ id }: NavIconProps) {
  const Icon = ICONS[id] ?? Bot;
  return <Icon aria-hidden strokeWidth={1.8} />;
}

export function LogOutIcon() {
  return <LogOut aria-hidden strokeWidth={1.8} />;
}
