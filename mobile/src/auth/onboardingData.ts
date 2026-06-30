export type ExamCategoryId =
  | 'UPSC'
  | 'SSC'
  | 'Banking'
  | 'Railways'
  | 'Police'
  | 'Defence'
  | 'State PSC'
  | 'Teaching'
  | 'Other';

export type ProfileCategory = 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS';

export const EXAM_CATEGORIES: { id: ExamCategoryId; label: string; emoji: string }[] = [
  { id: 'UPSC', label: 'UPSC CSE', emoji: '🏛️' },
  { id: 'SSC', label: 'SSC', emoji: '📋' },
  { id: 'Banking', label: 'Banking', emoji: '🏦' },
  { id: 'Railways', label: 'Railways', emoji: '🚆' },
  { id: 'Police', label: 'Police', emoji: '🛡️' },
  { id: 'Defence', label: 'Defence', emoji: '⚔️' },
  { id: 'State PSC', label: 'State PSC', emoji: '📍' },
  { id: 'Teaching', label: 'Teaching', emoji: '📚' },
  { id: 'Other', label: 'Other', emoji: '✨' },
];

export type CareerGoal = {
  id: string;
  title: string;
  subtitle: string;
  examTrack: string;
  categories: ExamCategoryId[];
};

export const CAREER_GOALS: CareerGoal[] = [
  {
    id: 'ias',
    title: 'IAS Officer',
    subtitle: 'Civil Services',
    examTrack: 'UPSC CSE',
    categories: ['UPSC'],
  },
  {
    id: 'bank-po',
    title: 'Bank PO',
    subtitle: 'Public sector banks',
    examTrack: 'IBPS PO',
    categories: ['Banking'],
  },
  {
    id: 'ssc-officer',
    title: 'SSC Officer',
    subtitle: 'CGL / CHSL',
    examTrack: 'SSC CGL',
    categories: ['SSC'],
  },
  {
    id: 'railway',
    title: 'Railway Officer',
    subtitle: 'RRB NTPC / Group D',
    examTrack: 'RRB NTPC',
    categories: ['Railways'],
  },
  {
    id: 'police',
    title: 'Police Constable',
    subtitle: 'State police forces',
    examTrack: 'Delhi Police Constable',
    categories: ['Police'],
  },
  {
    id: 'defence',
    title: 'Defence Officer',
    subtitle: 'CDS / AFCAT',
    examTrack: 'CDS',
    categories: ['Defence'],
  },
  {
    id: 'state-psc',
    title: 'State PSC Officer',
    subtitle: 'State civil services',
    examTrack: 'State PSC',
    categories: ['State PSC'],
  },
  {
    id: 'teacher',
    title: 'Government Teacher',
    subtitle: 'CTET / TET',
    examTrack: 'CTET',
    categories: ['Teaching'],
  },
  {
    id: 'other-govt-job',
    title: 'Other Government Job',
    subtitle: 'PSU, clerk, or any sarkari role',
    examTrack: 'Other',
    categories: ['Other'],
  },
];

export const EDUCATION_OPTIONS = [
  '10th Pass',
  '12th Pass',
  'Graduate',
  'Post Graduate',
  'Other',
] as const;

export const PROFILE_CATEGORIES: ProfileCategory[] = ['GEN', 'OBC', 'SC', 'ST', 'EWS'];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
] as const;

export const ATTEMPT_OPTIONS = [1, 2, 3, 4] as const;

export function getTargetYearOptions(): number[] {
  const year = new Date().getFullYear();
  return [year, year + 1, year + 2, year + 3];
}
