import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Sparkles, Users, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Screen,
  SectionTitle,
  StatTile,
  TextField,
} from '../../components';
import { useAuth } from '../../auth';
import {
  useAdminStats,
  useGenerateExam,
  usePendingTests,
  useReviewTest,
} from '../../hooks';
import { useTheme } from '../../theme';
import type { MainStackParamList } from '../../navigation/types';

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const statsQuery = useAdminStats();
  const pendingQuery = usePendingTests({ limit: 20 });
  const reviewTest = useReviewTest();
  const generateExam = useGenerateExam();

  const [title, setTitle] = useState('Full length mock');
  const [examTag, setExamTag] = useState('SSC CGL');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user && !isAdmin) {
      navigation.goBack();
    }
  }, [user, isAdmin, navigation]);

  if (!user || !isAdmin) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.denied}>Admin access only</Text>
      </Screen>
    );
  }

  const stats = statsQuery.data;
  const pending = pendingQuery.data?.items ?? [];

  const handleGenerate = () => {
    if (!title.trim() || !examTag.trim()) {
      Alert.alert('Missing fields', 'Enter a title and exam tag.');
      return;
    }

    generateExam.mutate(
      {
        title: title.trim(),
        examTag: examTag.trim(),
        language: 'en',
        difficulty: 'medium',
        publish: false,
        sections: [
          { subject: 'General Awareness', topic: 'Current affairs & static GK', count: 10 },
          { subject: 'Quantitative Aptitude', topic: 'Arithmetic & algebra', count: 10 },
          { subject: 'Reasoning', topic: 'Logical reasoning', count: 10 },
          { subject: 'English', topic: 'Grammar & comprehension', count: 10 },
        ],
      },
      {
        onSuccess: (data) => {
          Alert.alert('Exam generated', `"${data.title}" created and queued for review.`);
        },
        onError: (err) => Alert.alert('Generation failed', String(err)),
      },
    );
  };

  const handleReview = (id: string, decision: 'approve' | 'reject') => {
    reviewTest.mutate(
      { id, decision },
      {
        onError: (err) => Alert.alert('Review failed', String(err)),
      },
    );
  };

  const loading = statsQuery.isLoading || pendingQuery.isLoading;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Admin dashboard" subtitle="Platform stats and content moderation" />

      <Button
        label="Open content manager"
        variant="ghost"
        fullWidth
        onPress={() => navigation.navigate('AdminContent')}
      />

      {loading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : stats ? (
        <View style={styles.statsRow}>
          <StatTile label="Active students" value={stats.activeStudents} icon={<Users size={16} color={theme.colors.brand.primary} />} />
          <StatTile label="Total students" value={stats.totalStudents} />
        </View>
      ) : null}

      {stats ? (
        <View style={styles.statsRow}>
          <StatTile label="Tests live" value={stats.testsPublished} />
          <StatTile label="Pending review" value={stats.pendingReviews} />
          <StatTile label="Live classes" value={stats.liveClasses} />
        </View>
      ) : null}

      <SectionTitle title="Generate full exam with AI" />
      <Card style={styles.formCard}>
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Mock title" />
        <TextField label="Exam tag" value={examTag} onChangeText={setExamTag} placeholder="SSC CGL" />
        <Button
          label="Generate full exam with AI"
          icon={<Sparkles size={18} color={theme.colors.brand.onPrimary} />}
          loading={generateExam.isPending}
          onPress={handleGenerate}
          fullWidth
        />
      </Card>

      <SectionTitle title="Pending review" subtitle="Community & AI-generated tests" />
      {pending.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No tests waiting for review.</Text>
        </Card>
      ) : (
        <View style={styles.queue}>
          {pending.map((test) => {
            const testId = test.id ?? '';
            if (!testId) return null;
            return (
            <Card key={testId} style={styles.queueCard}>
              <Text style={styles.testTitle}>{test.title}</Text>
              <Text style={styles.testMeta}>
                {test.subject ?? 'General'}
                {test.createdBy?.name ? ` · by ${test.createdBy.name}` : ''}
              </Text>
              <View style={styles.reviewActions}>
                <Button
                  label="Approve"
                  size="sm"
                  icon={<Check size={14} color={theme.colors.brand.onPrimary} />}
                  onPress={() => handleReview(testId, 'approve')}
                  loading={reviewTest.isPending}
                  style={styles.reviewBtn}
                />
                <Button
                  label="Reject"
                  size="sm"
                  variant="ghost"
                  icon={<X size={14} color={theme.colors.semantic.error} />}
                  onPress={() => handleReview(testId, 'reject')}
                  loading={reviewTest.isPending}
                  style={styles.reviewBtn}
                />
              </View>
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
    statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
    formCard: { gap: theme.spacing.md },
    queue: { gap: theme.spacing.md },
    queueCard: { gap: theme.spacing.sm },
    testTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    testMeta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    reviewActions: { flexDirection: 'row', gap: theme.spacing.sm },
    reviewBtn: { flex: 1 },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
