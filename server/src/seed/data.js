function addDays(base, days) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

const now = new Date();

export const exams = [
  {
    name: 'SSC CGL',
    code: 'SSC-CGL',
    category: 'SSC',
    description: 'Combined Graduate Level examination conducted by Staff Selection Commission.',
    eligibility: { ageMin: 18, ageMax: 32, education: 'Graduate from a recognized university' },
    stages: [
      { name: 'Tier 1', order: 1 },
      { name: 'Tier 2', order: 2 },
      { name: 'Tier 3', order: 3 },
      { name: 'Tier 4', order: 4 },
    ],
    importantDates: [
      { label: 'Application Start', date: addDays(now, 14), type: 'open' },
      { label: 'Application End', date: addDays(now, 45), type: 'apply' },
      { label: 'Tier 1 Exam', date: addDays(now, 90), type: 'exam' },
      { label: 'Tier 1 Result', date: addDays(now, 130), type: 'result' },
    ],
    vacancies: 17727,
    cutoffs: [
      { year: 2024, category: 'GEN', marks: 143.5 },
      { year: 2024, category: 'OBC', marks: 130.2 },
      { year: 2024, category: 'SC', marks: 118.4 },
    ],
    recommendedBooks: [
      {
        title: 'Quantitative Aptitude for Competitive Examinations',
        author: 'R.S. Aggarwal',
        subject: 'Quantitative Aptitude',
        rating: 4.5,
        link: 'https://example.com/books/rs-aggarwal-quant',
      },
      {
        title: 'English Grammar and Composition',
        author: 'Wren & Martin',
        subject: 'English',
        rating: 4.6,
        link: 'https://example.com/books/wren-martin',
      },
    ],
  },
  {
    name: 'Delhi Police Constable',
    code: 'DELHI-POLICE-CONSTABLE',
    category: 'Police',
    description: 'Recruitment for Constable posts in Delhi Police including written and physical tests.',
    eligibility: { ageMin: 18, ageMax: 25, education: '10+2 or equivalent' },
    stages: [
      { name: 'Computer Based Test', order: 1 },
      { name: 'Physical Endurance Test', order: 2 },
      { name: 'Medical Examination', order: 3 },
    ],
    importantDates: [
      { label: 'Apply Online', date: addDays(now, 7), type: 'apply' },
      { label: 'Last Date to Apply', date: addDays(now, 30), type: 'apply' },
      { label: 'Written Exam', date: addDays(now, 75), type: 'exam' },
      { label: 'Admit Card', date: addDays(now, 60), type: 'admit' },
      { label: 'Result', date: addDays(now, 120), type: 'result' },
    ],
    vacancies: 7547,
    cutoffs: [
      { year: 2023, category: 'GEN', marks: 92 },
      { year: 2023, category: 'OBC', marks: 86 },
    ],
    recommendedBooks: [
      {
        title: 'Delhi Police Constable Guide',
        author: 'Arihant Experts',
        subject: 'General Awareness',
        rating: 4.2,
        link: 'https://example.com/books/delhi-police-guide',
      },
      {
        title: 'Physical Fitness for Police Exams',
        author: 'MK Fitness',
        subject: 'Physical Training',
        rating: 4.0,
        link: 'https://example.com/books/police-physical',
      },
    ],
  },
  {
    name: 'IBPS PO',
    code: 'IBPS-PO',
    category: 'Banking',
    description: 'Probationary Officer recruitment for public sector banks.',
    eligibility: { ageMin: 20, ageMax: 30, education: 'Graduate in any discipline' },
    stages: [
      { name: 'Prelims', order: 1 },
      { name: 'Mains', order: 2 },
      { name: 'Interview', order: 3 },
    ],
    importantDates: [
      { label: 'Registration Opens', date: addDays(now, 20), type: 'apply' },
      { label: 'Prelims Exam', date: addDays(now, 80), type: 'exam' },
      { label: 'Mains Exam', date: addDays(now, 140), type: 'exam' },
      { label: 'Final Result', date: addDays(now, 200), type: 'result' },
    ],
    vacancies: 4453,
    cutoffs: [{ year: 2024, category: 'GEN', marks: 76.5 }],
    recommendedBooks: [
      {
        title: 'Banking Awareness',
        author: 'Arihant',
        subject: 'Banking Awareness',
        rating: 4.3,
        link: 'https://example.com/books/banking-awareness',
      },
    ],
  },
];

export const courses = [
  {
    title: 'SSC CGL Quant Foundation',
    subject: 'Quantitative Aptitude',
    examTags: ['SSC', 'SSC-CGL'],
    isFree: true,
    thumbnailColor: '#4F46E5',
    lessons: [
      {
        title: 'Number System Basics',
        order: 1,
        videoUrl: 'https://example.com/videos/number-system',
        durationSec: 1200,
        notes: 'Cover divisibility, LCM, HCF and remainder theorem.',
      },
      {
        title: 'Percentage & Ratio',
        order: 2,
        videoUrl: 'https://example.com/videos/percentage-ratio',
        durationSec: 1500,
        notes: 'Practice compound percentage and ratio problems.',
      },
      {
        title: 'Time & Work',
        order: 3,
        videoUrl: 'https://example.com/videos/time-work',
        durationSec: 1800,
        notes: 'Efficiency method and alternate days problems.',
      },
    ],
  },
  {
    title: 'Delhi Police GK & Reasoning',
    subject: 'General Awareness',
    examTags: ['Police', 'DELHI-POLICE-CONSTABLE'],
    isFree: true,
    thumbnailColor: '#DC2626',
    lessons: [
      {
        title: 'Indian Polity for Police Exams',
        order: 1,
        videoUrl: 'https://example.com/videos/polity-police',
        durationSec: 1400,
        notes: 'Constitution articles relevant to law enforcement.',
      },
      {
        title: 'Delhi Current Affairs',
        order: 2,
        videoUrl: 'https://example.com/videos/delhi-ca',
        durationSec: 900,
        notes: 'Recent schemes and governance updates in Delhi.',
      },
    ],
  },
  {
    title: 'IBPS PO Reasoning Mastery',
    subject: 'Reasoning',
    examTags: ['Banking', 'IBPS-PO'],
    isFree: false,
    thumbnailColor: '#059669',
    lessons: [
      {
        title: 'Puzzles & Seating Arrangement',
        order: 1,
        videoUrl: 'https://example.com/videos/puzzles',
        durationSec: 2100,
        notes: 'Linear and circular arrangement tricks.',
      },
    ],
  },
];

export const currentAffairs = [
  {
    title: 'Union Budget 2026 Highlights for Competitive Exams',
    summary:
      'Key allocations for education, infrastructure, and employment schemes with exam-relevant facts.',
    category: 'Economy',
    source: 'PIB',
    publishedAt: addDays(now, -1),
    imageColor: '#F59E0B',
  },
  {
    title: 'India Hosts G20 Education Working Group Meeting',
    summary: 'Focus on digital learning, skill development, and international cooperation in education.',
    category: 'International',
    source: 'The Hindu',
    publishedAt: addDays(now, -2),
    imageColor: '#3B82F6',
  },
  {
    title: 'New Defence Procurement Policy Announced',
    summary: 'Policy pushes indigenisation and faster acquisition for armed forces modernization.',
    category: 'Defence',
    source: 'Indian Express',
    publishedAt: addDays(now, -3),
    imageColor: '#10B981',
  },
  {
    title: 'Railway Recruitment Board Announces NTPC Phase 2 Dates',
    summary: 'Exam cities and admit card schedule released for RRB NTPC undergraduate level posts.',
    category: 'Schemes',
    source: 'RRB Official',
    publishedAt: now,
    imageColor: '#8B5CF6',
  },
];

export const revisionCapsules = [
  {
    title: 'Algebra Formula Sheet',
    subject: 'Quantitative Aptitude',
    readMinutes: 8,
    body: `# Algebra Quick Revision

- $(a+b)^2 = a^2 + 2ab + b^2$
- $(a-b)^2 = a^2 - 2ab + b^2$
- $a^2 - b^2 = (a+b)(a-b)$

**Tip:** Substitute values when stuck on identity-based questions.`,
    bookmarkable: true,
  },
  {
    title: 'Indian Constitution: Fundamental Rights',
    subject: 'General Awareness',
    readMinutes: 10,
    body: `# Fundamental Rights (Articles 12-35)

1. Right to Equality (14-18)
2. Right to Freedom (19-22)
3. Right against Exploitation (23-24)
4. Right to Freedom of Religion (25-28)
5. Cultural and Educational Rights (29-30)
6. Right to Constitutional Remedies (32)`,
    bookmarkable: true,
  },
  {
    title: 'Blood Relations Tricks',
    subject: 'Reasoning',
    readMinutes: 6,
    body: `# Blood Relations

- Draw a family tree for every question.
- Convert statements to direct relations first.
- Watch for gender-neutral traps in exam wording.`,
    bookmarkable: true,
  },
];

export const vocabularyWords = [
  {
    word: 'abrogate',
    pronunciation: '/ˈæbrəɡeɪt/',
    partOfSpeech: 'verb',
    meaning: 'To repeal or abolish a law, right, or agreement formally',
    example: 'The government moved to abrogate the outdated ordinance.',
    synonyms: ['revoke', 'annul', 'repeal'],
    date: now,
  },
  {
    word: 'ephemeral',
    pronunciation: '/ɪˈfemərəl/',
    partOfSpeech: 'adjective',
    meaning: 'Lasting for a very short time',
    example: 'Social media trends are often ephemeral.',
    synonyms: ['transient', 'fleeting', 'short-lived'],
    date: addDays(now, -1),
  },
];

export const sampleQuestions = [
  {
    subject: 'General Awareness',
    topic: 'Budget',
    difficulty: 'medium',
    text: 'Which ministry received the highest allocation in the sample Union Budget 2026 summary?',
    options: [
      { key: 'A', text: 'Defence' },
      { key: 'B', text: 'Education' },
      { key: 'C', text: 'Railways' },
      { key: 'D', text: 'Agriculture' },
    ],
    correctKey: 'C',
    explanation: 'Railways infrastructure was highlighted as a major allocation area.',
    examTags: ['SSC', 'Banking'],
    source: 'official',
    language: 'en',
  },
];

export const testQuestions = [
  {
    subject: 'Quantitative Aptitude',
    topic: 'Percentage',
    difficulty: 'easy',
    text: 'What is 20% of 150?',
    options: [
      { key: 'A', text: '20' },
      { key: 'B', text: '25' },
      { key: 'C', text: '30' },
      { key: 'D', text: '35' },
    ],
    correctKey: 'C',
    explanation: '20% of 150 = 0.2 × 150 = 30',
    examTags: ['SSC', 'SSC-CGL'],
    source: 'official',
    language: 'en',
  },
  {
    subject: 'Quantitative Aptitude',
    topic: 'Ratio',
    difficulty: 'medium',
    text: 'The ratio of two numbers is 3:5. If their sum is 48, what is the larger number?',
    options: [
      { key: 'A', text: '18' },
      { key: 'B', text: '24' },
      { key: 'C', text: '30' },
      { key: 'D', text: '36' },
    ],
    correctKey: 'C',
    explanation: '3x + 5x = 48 → x = 6. Larger number = 5x = 30.',
    examTags: ['SSC', 'SSC-CGL'],
    source: 'official',
    language: 'en',
  },
  {
    subject: 'General Awareness',
    topic: 'Polity',
    difficulty: 'easy',
    text: 'Which article of the Indian Constitution deals with the Right to Equality?',
    options: [
      { key: 'A', text: 'Article 14' },
      { key: 'B', text: 'Article 19' },
      { key: 'C', text: 'Article 21' },
      { key: 'D', text: 'Article 32' },
    ],
    correctKey: 'A',
    explanation: 'Article 14 guarantees equality before the law.',
    examTags: ['SSC', 'Police'],
    source: 'official',
    language: 'en',
  },
  {
    subject: 'Reasoning',
    topic: 'Series',
    difficulty: 'medium',
    text: 'Find the next number in the series: 2, 6, 12, 20, ?',
    options: [
      { key: 'A', text: '28' },
      { key: 'B', text: '30' },
      { key: 'C', text: '32' },
      { key: 'D', text: '34' },
    ],
    correctKey: 'B',
    explanation: 'Differences are +4, +6, +8, so next difference is +10 → 20 + 10 = 30.',
    examTags: ['SSC', 'Banking'],
    source: 'official',
    language: 'en',
  },
];

export const tests = [
  {
    title: 'SSC CGL Quant Sectional #1',
    subject: 'Quantitative Aptitude',
    topic: 'Percentage & Ratio',
    difficulty: 'medium',
    durationSec: 1200,
    type: 'sectional',
    examTag: 'SSC-CGL',
    status: 'published',
  },
  {
    title: 'SSC CGL Full Mock #1',
    subject: 'Mixed',
    topic: 'All Sections',
    difficulty: 'medium',
    durationSec: 3600,
    type: 'mock',
    examTag: 'SSC-CGL',
    status: 'published',
  },
  {
    title: 'Delhi Police GK Draft',
    subject: 'General Awareness',
    topic: 'Polity',
    difficulty: 'easy',
    durationSec: 900,
    type: 'sectional',
    examTag: 'DELHI-POLICE-CONSTABLE',
    status: 'draft',
  },
];

export const testSeries = [
  {
    title: 'SSC CGL 2026 All India Test Series',
    examTag: 'SSC-CGL',
    mocks: [
      { testIndex: 1, unlockDate: addDays(now, -7), isLive: false },
      { testIndex: 1, unlockDate: addDays(now, -1), isLive: true },
      { testIndex: 1, unlockDate: addDays(now, 7), isLive: false },
    ],
  },
];

export const seedAdminUser = {
  name: 'Sopaan Admin',
  email: 'admin@sopaan.dev',
  phone: '9999999999',
  role: 'admin',
  password: 'Password123!',
};

export const seedMentorUser = {
  name: 'Priya Sharma',
  email: 'mentor@sopaan.dev',
  phone: '9888888888',
  role: 'creator',
  password: 'Password123!',
};

/** Pre-seeded student for Maestro / Detox E2E (login flows). */
export const seedE2eStudentUser = {
  name: 'E2E Student',
  email: 'student@sopaan.dev',
  phone: '9777777777',
  role: 'student',
  password: 'Password123!',
  coins: 500,
  privacyConsent: {
    policyVersion: '2025-06-01',
    acceptedAt: now,
    aiProcessing: true,
    marketing: false,
  },
  profile: {
    education: 'Graduate',
    category: 'GEN',
    state: 'Delhi',
    attemptNumber: 1,
    targetYear: now.getFullYear() + 1,
    goal: {
      examTrack: 'SSC CGL',
      targetYear: now.getFullYear() + 1,
    },
    preferences: {
      language: 'en',
      dailyGoalMinutes: 60,
    },
  },
};

/** Student with trial already used — paywall UI-only flows. */
export const seedE2ePaywallStudentUser = {
  name: 'E2E Paywall Student',
  email: 'paywall@sopaan.dev',
  phone: '9666666666',
  role: 'student',
  password: 'Password123!',
  coins: 50,
  premiumTrialUsed: true,
  privacyConsent: {
    policyVersion: '2025-06-01',
    acceptedAt: now,
    aiProcessing: true,
    marketing: false,
  },
  profile: {
    education: 'Graduate',
    category: 'GEN',
    state: 'Delhi',
    attemptNumber: 1,
    targetYear: now.getFullYear() + 1,
    goal: {
      examTrack: 'SSC CGL',
      targetYear: now.getFullYear() + 1,
    },
    preferences: {
      language: 'en',
      dailyGoalMinutes: 45,
    },
  },
};

export const rewards = [
  { title: 'Dark Theme', type: 'theme', coinCost: 100, icon: 'moon' },
  { title: 'Premium Mock Unlock', type: 'unlock', coinCost: 250, icon: 'lock-open' },
  { title: '10% Course Discount', type: 'discount', coinCost: 150, icon: 'percent' },
  { title: 'Bonus Mentor Q&A', type: 'mentor', coinCost: 500, icon: 'chat' },
];

const mentorNow = new Date();

export const mentorProfile = {
  expertise: ['SSC', 'SSC-CGL', 'Quantitative Aptitude'],
  rating: 4.8,
  sessionsCount: 42,
  bio: 'SSC CGL qualifier with 5+ years mentoring experience in quantitative aptitude.',
  slots: [
    { start: addDays(mentorNow, 2), isBooked: false },
    { start: addDays(mentorNow, 3), isBooked: false },
    { start: addDays(mentorNow, 5), isBooked: false },
  ],
};

export const liveClasses = [
  {
    title: 'SSC CGL Quant Speed Tricks',
    instructor: 'Amit Sir',
    examTag: 'SSC-CGL',
    scheduledAt: addDays(now, 1),
    durationMin: 60,
    thumbnailColor: '#4F46E5',
    streamingRoomId: 'sopaan-ssc-cgl-quant-seed',
    status: 'scheduled',
  },
  {
    title: 'Banking Awareness Marathon',
    instructor: "Neha Ma'am",
    examTag: 'IBPS-PO',
    scheduledAt: addDays(now, 2),
    durationMin: 45,
    thumbnailColor: '#059669',
    streamingRoomId: 'sopaan-banking-awareness-seed',
    status: 'scheduled',
  },
  {
    title: 'Live: Current Affairs Rapid Fire',
    instructor: 'Sopaan Faculty',
    examTag: 'General',
    scheduledAt: now,
    startedAt: now,
    durationMin: 40,
    thumbnailColor: '#F59E0B',
    streamingRoomId: 'sopaan-ca-rapid-fire-seed',
    streamingProvider: 'dev',
    status: 'live',
    attendeeCount: 0,
  },
];

export const libraryBooks = [
  {
    title: 'Fast-Track Quantitative Aptitude',
    slug: 'fast-track-quant',
    author: 'Sopaan Editorial',
    subject: 'quant',
    description: 'Speed tricks and shortcuts for SSC and banking quant.',
    coverTheme: 'navy',
    pages: 420,
    rating: 4.8,
    ratingsCount: 312,
    isPro: false,
    status: 'published',
    tags: ['quant', 'shortcuts'],
  },
  {
    title: 'SSC CGL Complete Master Guide',
    slug: 'ssc-cgl-master-guide',
    author: 'Sopaan Editorial',
    subject: 'gk',
    description: 'Complete guide for SSC CGL 2026.',
    coverTheme: 'gold',
    pages: 820,
    rating: 4.9,
    ratingsCount: 540,
    isPro: true,
    status: 'published',
    tags: ['ssc', 'guide'],
  },
  {
    title: 'Reasoning Decoded',
    slug: 'reasoning-decoded',
    author: 'M. Pandey',
    subject: 'reasoning',
    description: 'Pattern-based reasoning for all competitive exams.',
    coverTheme: 'sage',
    pages: 360,
    rating: 4.8,
    ratingsCount: 210,
    isPro: false,
    status: 'published',
    tags: ['reasoning'],
  },
  {
    title: 'Polity Simplified',
    slug: 'polity-simplified',
    author: 'A. Menon',
    subject: 'gk',
    description: 'Indian polity made simple for prelims and mains.',
    coverTheme: 'deep',
    pages: 280,
    rating: 4.9,
    ratingsCount: 188,
    isPro: true,
    status: 'published',
    tags: ['polity'],
  },
  {
    title: 'English Grammar Pro',
    slug: 'english-grammar-pro',
    author: 'R. Iyer',
    subject: 'english',
    description: 'Grammar rules with exam-focused practice.',
    coverTheme: 'rust',
    pages: 240,
    rating: 4.7,
    ratingsCount: 156,
    isPro: false,
    status: 'published',
    tags: ['english'],
  },
  {
    title: 'Current Affairs Capsule — June',
    slug: 'current-affairs-capsule-june',
    author: 'Sopaan Editorial',
    subject: 'current_affairs',
    description: 'Monthly current affairs rapid revision PDF.',
    coverTheme: 'rust',
    pages: 48,
    rating: 4.6,
    ratingsCount: 92,
    isPro: false,
    status: 'published',
    tags: ['pdf', 'notes'],
  },
  {
    title: 'Quant Formula Sheet',
    slug: 'quant-formula-sheet',
    author: 'Sopaan Editorial',
    subject: 'quant',
    description: 'All quant shortcuts on one sheet.',
    coverTheme: 'navy',
    pages: 22,
    rating: 4.5,
    ratingsCount: 410,
    isPro: false,
    status: 'published',
    tags: ['pdf', 'note'],
  },
  {
    title: '500 One-liner GK',
    slug: '500-one-liner-gk',
    author: 'Sopaan Editorial',
    subject: 'static_gk',
    description: 'Rapid GK revision one-liners.',
    coverTheme: 'sage',
    pages: 30,
    rating: 4.4,
    ratingsCount: 120,
    isPro: false,
    status: 'published',
    tags: ['pdf', 'notes'],
  },
];

