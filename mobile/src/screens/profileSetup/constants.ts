/** Target exams shown as onboarding chips (maps to Profile.targetExam). */
export const TARGET_EXAM_OPTIONS = [
  { label: 'SSC', value: 'SSC CGL', emoji: '📋' },
  { label: 'Banking', value: 'IBPS PO', emoji: '🏦' },
  { label: 'Railway', value: 'RRB NTPC', emoji: '🚆' },
  { label: 'Defence', value: 'CDS', emoji: '⚔️' },
  { label: 'Teaching', value: 'CTET', emoji: '📚' },
  { label: 'State PSC', value: 'State PSC', emoji: '📍' },
  { label: 'UPSC', value: 'UPSC CSE', emoji: '🏛️' },
  { label: 'Police', value: 'Police Constable', emoji: '🛡️' },
] as const;

export const INDIAN_STATES_ALL = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export const PROFILE_CATEGORY_OPTIONS = ['GEN', 'OBC', 'SC', 'ST', 'EWS'] as const;

export const EDUCATION_LEVEL_OPTIONS = [
  { label: '10th', value: '10th' as const },
  { label: '12th', value: '12th' as const },
  { label: 'Graduate', value: 'Graduate' as const },
  { label: 'Post Graduate', value: 'PG' as const },
  { label: 'Diploma', value: 'Diploma' as const },
];

export const LANGUAGE_OPTIONS = [
  { id: 'en' as const, title: 'English', subtitle: 'English' },
  { id: 'hi' as const, title: 'Hindi', subtitle: 'हिन्दी' },
  { id: 'gu' as const, title: 'Gujarati', subtitle: 'ગુજરાતી' },
];

export const PROFILE_SETUP_STEPS = ['Goal', 'You', 'Language'] as const;
