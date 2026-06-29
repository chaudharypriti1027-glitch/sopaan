import { apiClient } from './client';
import type { Course, Exam, PaginatedResponse, TestSummary } from './types';

export type SearchResultGroup = 'exams' | 'courses' | 'tests' | 'ai';

export type SearchResult = {
  id: string;
  group: SearchResultGroup;
  title: string;
  subtitle?: string;
  route: string;
  routeParams?: Record<string, string | undefined>;
};

export type SearchResponse = {
  query: string;
  results: Record<SearchResultGroup, SearchResult[]>;
};

function matchesQuery(text: string | undefined, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

function mapExam(exam: Exam & { _id?: string }): SearchResult {
  return {
    id: exam.id ?? exam._id ?? exam.name,
    group: 'exams',
    title: exam.name,
    subtitle: exam.category as string | undefined,
    route: 'ExamDetail',
    routeParams: { examId: exam.id ?? exam._id },
  };
}

function mapCourse(course: Course & { _id?: string }): SearchResult {
  const courseId = course.id ?? course._id ?? course.title;
  return {
    id: courseId,
    group: 'courses',
    title: course.title,
    subtitle: course.description as string | undefined,
    route: 'CourseDetail',
    routeParams: { courseId },
  };
}

function mapTest(test: TestSummary & { _id?: string }): SearchResult {
  return {
    id: test.id ?? test._id ?? test.title,
    group: 'tests',
    title: test.title,
    subtitle: [test.subject, test.difficulty].filter(Boolean).join(' · '),
    route: 'Quiz',
    routeParams: { testId: test.id ?? test._id },
  };
}

export async function searchAll(query: string): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: '', results: { exams: [], courses: [], tests: [], ai: [] } };
  }

  const [examsRes, coursesRes, testsRes] = await Promise.all([
    apiClient.get<PaginatedResponse<Exam>>('/exams', { params: { limit: 50 } }),
    apiClient.get<PaginatedResponse<Course>>('/courses', { params: { limit: 50 } }),
    apiClient.get<PaginatedResponse<TestSummary>>('/tests', { params: { limit: 50 } }),
  ]);

  const exams = examsRes.data.items
    .filter(
      (exam) =>
        matchesQuery(exam.name, trimmed) ||
        matchesQuery(exam.category as string, trimmed) ||
        matchesQuery(exam.code as string, trimmed),
    )
    .slice(0, 8)
    .map(mapExam);

  const courses = coursesRes.data.items
    .filter(
      (course) =>
        matchesQuery(course.title, trimmed) ||
        matchesQuery(course.description as string, trimmed),
    )
    .slice(0, 8)
    .map(mapCourse);

  const tests = testsRes.data.items
    .filter(
      (test) =>
        matchesQuery(test.title, trimmed) ||
        matchesQuery(test.subject, trimmed) ||
        matchesQuery(test.examTag as string, trimmed),
    )
    .slice(0, 8)
    .map(mapTest);

  const ai: SearchResult[] = [
    {
      id: `ai-${trimmed}`,
      group: 'ai',
      title: `Ask AI about “${trimmed}”`,
      subtitle: 'Get instant explanations & study tips',
      route: 'AskAI',
    },
  ];

  return {
    query: trimmed,
    results: { exams, courses, tests, ai },
  };
}
