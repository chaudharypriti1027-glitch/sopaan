export interface QualityIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  metadata?: {
    questionId?: string;
    mergeTargetId?: string;
    score?: number;
    preview?: string;
  };
}

export interface QuestionDuplicateRef {
  id: string;
  text?: string;
  subject?: string;
  topic?: string;
}

export interface AdminQuestion {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  status: 'draft' | 'published';
  reviewStatus: 'pending' | 'approved' | 'rejected';
  qualityIssues: QualityIssue[];
  duplicateOf: QuestionDuplicateRef | null;
  duplicateScore?: number | null;
  canPublish: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface QuestionListParams {
  q?: string;
  status?: 'draft' | 'published';
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  subject?: string;
  limit?: number;
  offset?: number;
}

export interface QuestionImportResult {
  totalRows: number;
  insertedCount: number;
  errorCount: number;
  pendingReviewCount: number;
  errors: Array<{ row: number; errors: Array<{ field: string; message: string }> }>;
  inserted: AdminQuestion[];
}
