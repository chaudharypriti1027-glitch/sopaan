import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Pill,
  Screen,
  SectionTitle,
  SegTabs,
  TextField,
} from '../../components';
import { useAuth } from '../../auth';
import {
  useAdminCourses,
  useAdminCurrentAffairs,
  useAdminExams,
  useAdminQuestions,
  useAdminReviewQueue,
  useDeleteContent,
  useImportQuestions,
  useReviewQuestion,
  useSetContentStatus,
} from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import type {
  AdminCourse,
  AdminCurrentAffair,
  AdminExam,
  AdminQuestion,
  ContentStatus,
  QuestionImportResult,
} from '../../api/adminContent';
import { useTheme } from '../../theme';

type ContentTab = 'questions' | 'review-queue' | 'exams' | 'courses' | 'current-affairs';

const TAB_OPTIONS = [
  { key: 'questions' as const, label: 'Questions' },
  { key: 'review-queue' as const, label: 'Review queue' },
  { key: 'exams' as const, label: 'Exams' },
  { key: 'courses' as const, label: 'Courses' },
  { key: 'current-affairs' as const, label: 'Current affairs' },
];

const SAMPLE_IMPORT = `[{
  "subject": "Polity",
  "topic": "Fundamental Rights",
  "difficulty": "medium",
  "text": "Which article abolishes untouchability?",
  "options": [
    { "key": "A", "text": "Article 14" },
    { "key": "B", "text": "Article 17" },
    { "key": "C", "text": "Article 21" },
    { "key": "D", "text": "Article 32" }
  ],
  "correctKey": "B",
  "explanation": "Article 17 abolishes untouchability.",
  "examTags": ["UPSC"]
}]`;

export function AdminContentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tab, setTab] = useState<ContentTab>('questions');
  const [search, setSearch] = useState('');
  const [importJson, setImportJson] = useState('');

  const query = useMemo(
    () => ({ q: search.trim() || undefined, limit: 30 }),
    [search],
  );

  const questionsQuery = useAdminQuestions(tab === 'questions' ? query : undefined);
  const reviewQueueQuery = useAdminReviewQueue(tab === 'review-queue' ? query : undefined);
  const examsQuery = useAdminExams(tab === 'exams' ? query : undefined);
  const coursesQuery = useAdminCourses(tab === 'courses' ? query : undefined);
  const affairsQuery = useAdminCurrentAffairs(tab === 'current-affairs' ? query : undefined);

  const importMutation = useImportQuestions();
  const reviewMutation = useReviewQuestion();
  const statusMutation = useSetContentStatus(tab === 'review-queue' ? 'questions' : tab);
  const deleteMutation = useDeleteContent(tab === 'review-queue' ? 'questions' : tab);

  const isAdmin = user?.role === 'admin';

  if (!user || !isAdmin) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.denied}>Admin access only</Text>
      </Screen>
    );
  }

  const activeQuery =
    tab === 'questions'
      ? questionsQuery
      : tab === 'review-queue'
        ? reviewQueueQuery
        : tab === 'exams'
          ? examsQuery
          : tab === 'courses'
            ? coursesQuery
            : affairsQuery;

  const items: (AdminQuestion | AdminExam | AdminCourse | AdminCurrentAffair)[] =
    activeQuery.data?.items ?? [];

  const toggleStatus = (id: string, current?: ContentStatus, canPublish?: boolean) => {
    if (canPublish === false) {
      Alert.alert('Quality gate', 'Fix or merge review issues before publishing this question.');
      return;
    }

    const next: ContentStatus = current === 'published' ? 'draft' : 'published';
    statusMutation.mutate(
      { id, status: next },
      { onError: (err) => Alert.alert('Update failed', String(err)) },
    );
  };

  const handleReviewAction = (
    id: string,
    action: 'fix' | 'merge' | 'reject',
    mergeTargetId?: string,
  ) => {
    reviewMutation.mutate(
      { id, action, mergeTargetId },
      {
        onSuccess: () => Alert.alert('Review updated', `Question ${action} completed.`),
        onError: (err) => Alert.alert('Review failed', String(err)),
      },
    );
  };

  const confirmMerge = (item: AdminQuestion) => {
    const targetId = item.duplicateOf?.id;
    if (!targetId) {
      return;
    }

    Alert.alert(
      'Merge duplicate?',
      item.duplicateOf?.text
        ? `Keep canonical: "${item.duplicateOf.text.slice(0, 80)}…"`
        : 'Merge this question into the matched canonical question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: () => handleReviewAction(item.id, 'merge', targetId),
        },
      ],
    );
  };

  const confirmDelete = (id: string, label: string) => {
    Alert.alert('Delete item?', label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteMutation.mutate(id, {
            onError: (err) => Alert.alert('Delete failed', String(err)),
          }),
      },
    ]);
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson.trim() || SAMPLE_IMPORT);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      const result: QuestionImportResult = await importMutation.mutateAsync(questions);
      Alert.alert(
        'Import complete',
        `Inserted ${result.insertedCount} of ${result.totalRows}. ${result.errorCount} row errors.${result.pendingReviewCount ? ` ${result.pendingReviewCount} need review.` : ''}`,
      );
      setImportJson('');
    } catch (error) {
      Alert.alert('Import failed', String(error));
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <SectionTitle title="Content manager" subtitle="Official questions, exams, courses, and current affairs" />

      <SegTabs options={TAB_OPTIONS} value={tab} onChange={setTab} />

      <TextField
        label="Search"
        placeholder="Search title or text…"
        value={search}
        onChangeText={setSearch}
      />

      {tab === 'questions' ? (
        <Card style={styles.importCard}>
          <Text style={styles.importTitle}>Import questions (JSON)</Text>
          <TextField
            label="JSON array"
            placeholder="Paste questions JSON…"
            value={importJson}
            onChangeText={setImportJson}
            multiline
            style={styles.importInput}
          />
          <Button
            label={importMutation.isPending ? 'Importing…' : 'Import official questions'}
            onPress={handleImport}
            disabled={importMutation.isPending}
            fullWidth
          />
        </Card>
      ) : null}

      {activeQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : items.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No items found.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const id =
              'id' in item && item.id
                ? item.id
                : '_id' in item && item._id
                  ? item._id
                  : '';
            const title =
              'text' in item
                ? item.text
                : 'name' in item
                  ? item.name
                  : 'title' in item
                    ? item.title
                    : 'Item';
            const status = item.status ?? 'draft';
            const question = tab === 'questions' || tab === 'review-queue' ? (item as AdminQuestion) : null;
            const meta =
              'subject' in item && item.subject
                ? `${item.subject}${'topic' in item && item.topic ? ` · ${item.topic}` : ''}`
                : 'category' in item && item.category
                  ? String(item.category)
                  : 'code' in item && item.code
                    ? String(item.code)
                    : '';

            return (
              <Card key={id} style={styles.row}>
                <View style={styles.rowHeader}>
                  <View style={styles.pillRow}>
                    <Pill
                      label={status === 'published' ? 'Published' : 'Draft'}
                      variant={status === 'published' ? 'teal' : 'muted'}
                    />
                    {question?.reviewStatus === 'pending' ? (
                      <Pill label="Needs review" variant="gold" />
                    ) : null}
                    {question?.source ? (
                      <Pill label={question.source} variant="muted" />
                    ) : null}
                  </View>
                  <Pressable onPress={() => confirmDelete(id, title.slice(0, 80))} hitSlop={8}>
                    <Trash2 size={18} color={theme.colors.semantic.error} />
                  </Pressable>
                </View>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {title}
                </Text>
                {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
                {question?.qualityIssues?.length ? (
                  <View style={styles.issueList}>
                    {question.qualityIssues.map((issue) => (
                      <Text key={`${issue.code}-${issue.message}`} style={styles.issueText}>
                        • {issue.message}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {question?.duplicateOf?.text ? (
                  <Text style={styles.duplicateText} numberOfLines={2}>
                    Duplicate of: {question.duplicateOf.text}
                  </Text>
                ) : null}
                {'updatedAt' in item && item.updatedAt ? (
                  <Text style={styles.audit}>Updated {new Date(item.updatedAt).toLocaleString()}</Text>
                ) : null}
                {tab === 'review-queue' && question ? (
                  <View style={styles.reviewActions}>
                    <Button
                      label="Re-check"
                      variant="ghost"
                      size="sm"
                      onPress={() => handleReviewAction(id, 'fix')}
                      disabled={reviewMutation.isPending}
                    />
                    {question.duplicateOf?.id ? (
                      <Button
                        label="Merge"
                        variant="ghost"
                        size="sm"
                        onPress={() => confirmMerge(question)}
                        disabled={reviewMutation.isPending}
                      />
                    ) : null}
                    <Button
                      label="Reject"
                      variant="ghost"
                      size="sm"
                      onPress={() => handleReviewAction(id, 'reject')}
                      disabled={reviewMutation.isPending}
                    />
                  </View>
                ) : (
                  <Button
                    label={
                      question?.canPublish === false && status !== 'published'
                        ? 'Blocked by quality gate'
                        : status === 'published'
                          ? 'Unpublish'
                          : 'Publish'
                    }
                    variant="ghost"
                    size="sm"
                    onPress={() => toggleStatus(id, status, question?.canPublish)}
                    disabled={statusMutation.isPending || (question?.canPublish === false && status !== 'published')}
                  />
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center' },
    denied: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    back: { ...theme.typography.presets.bodyMedium, color: theme.colors.brand.primary },
    importCard: { gap: theme.spacing.md },
    importTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    importInput: { minHeight: 120, textAlignVertical: 'top' },
    list: { gap: theme.spacing.md },
    row: { gap: theme.spacing.sm },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, flex: 1 },
    rowTitle: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    rowMeta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    issueList: { gap: theme.spacing.xs },
    issueText: { ...theme.typography.presets.caption, color: theme.colors.semantic.warning },
    duplicateText: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    reviewActions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    audit: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
