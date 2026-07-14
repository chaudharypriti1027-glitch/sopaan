export type PublishStatus = 'draft' | 'published';

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ContentListParams {
  q?: string;
  status?: PublishStatus;
  limit?: number;
  offset?: number;
}

export interface AdminExam {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  status: PublishStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCourseLesson {
  id?: string;
  _id?: string;
  title: string;
  order: number;
  videoUrl?: string;
  durationSec?: number;
  notes?: string;
  materialUrl?: string;
  materialName?: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  subject: string;
  examTags?: string[];
  isFree?: boolean;
  lessons?: AdminCourseLesson[];
  thumbnailColor?: string;
  thumbnailUrl?: string;
  status: PublishStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCurrentAffair {
  id: string;
  title: string;
  summary?: string;
  body?: string;
  category?: string;
  source?: string;
  sourceUrl?: string;
  publishedAt: string;
  imageColor?: string;
  imageUrl?: string;
  quizQuestions?: string[];
  status: PublishStatus;
  createdAt?: string;
  updatedAt?: string;
}
