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

export interface AdminCourse {
  id: string;
  title: string;
  subject: string;
  examTags?: string[];
  isFree?: boolean;
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
  category?: string;
  source?: string;
  publishedAt: string;
  imageColor?: string;
  quizQuestions?: string[];
  status: PublishStatus;
  createdAt?: string;
  updatedAt?: string;
}
