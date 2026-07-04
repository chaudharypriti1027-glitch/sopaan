export type UserRole = 'user' | 'student' | 'creator' | 'moderator' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
  role: UserRole;
  isPremium?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  profile: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role?: UserRole;
  };
}

export interface RefreshResponse {
  token: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface DailySeriesPoint {
  date: string;
  label: string;
  value: number;
}

export interface AdminStats {
  activeStudents: number;
  totalStudents: number;
  attemptsLast30Days: number;
  testsPublished: number;
  pendingReviews: number;
  pendingQuestionReviews: number;
  questionsTotal: number;
  questionsPublished: number;
  coursesPublished: number;
  currentAffairsPublished: number;
  liveClasses: number;
  examsTotal: number;
  mentorsTotal: number;
  aiFeedbackPending: number;
  assessedAt?: string;
}

export interface AttemptsSeriesResponse {
  days: number;
  series: DailySeriesPoint[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  at: string;
  actor: { id: string; name: string; email?: string | null; role: UserRole } | null;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  nextCursor: string | null;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
