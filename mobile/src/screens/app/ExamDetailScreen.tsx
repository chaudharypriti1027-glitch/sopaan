import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpen, Map } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AIBadge,
  AIGoldCard,
  Button,
  Card,
  PremiumHeroCard,
  Screen,
  SectionTitle,
  SegTabs,
} from '../../components';
import { useExam, useGoalRoadmap, useProfile } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type ExamDetailRoute = RouteProp<MainStackParamList, 'ExamDetail'>;
type ExamDetailNav = NativeStackNavigationProp<MainStackParamList, 'ExamDetail'>;

type PrepareTab = 'overview' | 'syllabus' | 'strategy';

function buildNinetyDayPlan(stages: { name: string }[]) {
  const phaseCount = Math.max(stages.length, 3);
  const weeksPerPhase = Math.floor(13 / phaseCount);
  let day = 1;

  return stages.map((stage, index) => {
    const start = day;
    day += weeksPerPhase * 7;
    const end = Math.min(index === stages.length - 1 ? 90 : day - 1, 90);
    return {
      week: index + 1,
      phase: stage.name,
      dayRange: `${start}-${end}`,
    };
  });
}

export function ExamDetailScreen() {
  const route = useRoute<ExamDetailRoute>();
  const navigation = useNavigation<ExamDetailNav>();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);

  const TAB_OPTIONS = useMemo(
    () => [
      { key: 'overview' as const, label: t('examDetail.tabOverview') },
      { key: 'syllabus' as const, label: t('examDetail.tabSyllabus') },
      { key: 'strategy' as const, label: t('examDetail.tabStrategy') },
    ],
    [t],
  );

  const [tab, setTab] = useState<PrepareTab>('overview');
  const profileQuery = useProfile();
  const goalQuery = useGoalRoadmap(Boolean(profileQuery.data?.profile.goal?.examTrack));

  const examId =
    route.params?.examId ??
    (goalQuery.data?.exam as { _id?: string; id?: string } | undefined)?.id ??
    (goalQuery.data?.exam as { _id?: string } | undefined)?._id?.toString();
  const examQuery = useExam(examId);

  const exam = examQuery.data;
  const roadmap = goalQuery.data?.roadmap;
  const planBlocks = useMemo(() => {
    const stages = roadmap?.stages?.length
      ? roadmap.stages.map((s) => ({ name: s.name }))
      : [
          { name: t('examDetail.foundation') },
          { name: t('examDetail.practice') },
          { name: t('examDetail.revision') },
        ];
    return buildNinetyDayPlan(stages);
  }, [roadmap?.stages, t]);

  if (examQuery.isLoading || goalQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  if (!exam) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.empty}>{t('examDetail.notFound')}</Text>
        <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const books = exam.recommendedBooks ?? [];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title={exam.name} subtitle={exam.category ?? exam.code} />

      <SegTabs options={TAB_OPTIONS} value={tab} onChange={setTab} />

      {tab === 'overview' ? (
        <Card style={styles.block}>
          <Text style={styles.body}>{exam.description ?? t('examDetail.noDescription')}</Text>
          {exam.eligibility ? (
            <View style={styles.eligibility}>
              <Text style={styles.subheading}>{t('examDetail.eligibility')}</Text>
              {exam.eligibility.education ? (
                <Text style={styles.meta}>{t('examDetail.education', { value: exam.eligibility.education })}</Text>
              ) : null}
              {exam.eligibility.ageMin != null ? (
                <Text style={styles.meta}>
                  {t('examDetail.age', { min: exam.eligibility.ageMin, max: exam.eligibility.ageMax })}
                </Text>
              ) : null}
            </View>
          ) : null}
          {exam.vacancies != null ? (
            <Text style={styles.meta}>
              {t('examDetail.vacancies', { count: exam.vacancies.toLocaleString('en-IN') })}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {tab === 'syllabus' ? (
        <Card style={styles.block}>
          {(exam.stages ?? []).length > 0 ? (
            (exam.stages ?? []).map((stage) => (
              <View key={stage.order} style={styles.stageRow}>
                <Text style={styles.stageOrder}>{stage.order}</Text>
                <Text style={styles.stageName}>{stage.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.body}>{t('examDetail.syllabusSoon')}</Text>
          )}
        </Card>
      ) : null}

      {tab === 'strategy' ? (
        <Card style={styles.block}>
          {(roadmap?.stages ?? []).map((stage) => (
            <View key={stage.order} style={styles.tipBlock}>
              <Text style={styles.subheading}>{stage.name}</Text>
              {stage.tips.map((tip) => (
                <Text key={tip} style={styles.tip}>• {tip}</Text>
              ))}
            </View>
          ))}
        </Card>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle title={t('examDetail.ninetyDayPlan')} />
          <AIBadge label={t('examDetail.planBadge')} />
        </View>
        <AIGoldCard style={styles.planCard}>
          {planBlocks.map((block) => (
            <View key={`${block.phase}-${block.week}`} style={styles.planRow}>
              <Text style={styles.planDays}>{t('examDetail.daysRange', { range: block.dayRange })}</Text>
              <Text style={styles.planPhase}>{t('examDetail.weekPhase', { phase: block.phase, week: block.week })}</Text>
              <Text style={styles.planFocus}>{t('examDetail.phaseFocus', { phase: block.phase })}</Text>
            </View>
          ))}
        </AIGoldCard>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle title={t('examDetail.recommendedBooks')} />
          <BookOpen size={18} color={theme.colors.text.tertiary} />
        </View>
        <Card style={styles.block}>
          {books.length > 0 ? (
            books.map((book) => (
              <View key={book.title} style={styles.bookRow}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.meta}>
                  {book.author}
                  {book.subject ? ` · ${book.subject}` : ''}
                  {book.rating != null ? ` · ★ ${book.rating}` : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.body}>{t('examDetail.noBooks')}</Text>
          )}
          <Button
            label={t('examDetail.browseBooks')}
            variant="ghost"
            onPress={() => navigation.navigate('Books', { examId: exam.id })}
          />
        </Card>
      </View>

      {roadmap ? (
        <PremiumHeroCard
          icon={<Map size={24} color="#FFFFFF" strokeWidth={1.8} />}
          eyebrow={t('examDetail.roadmapTitle')}
          title={roadmap.currentStage ?? '—'}
          stats={[{ label: t('examDetail.roadmapTitle'), value: `${roadmap.overallProgress ?? 0}%` }]}
        >
          <Button
            label={t('examDetail.viewJourney')}
            variant="gold"
            onPress={() => navigation.navigate('Roadmap')}
          />
        </PremiumHeroCard>
      ) : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    block: { gap: theme.spacing.md },
    body: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    meta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    subheading: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    eligibility: { gap: theme.spacing.xs },
    stageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    stageOrder: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      width: 24,
    },
    stageName: { ...theme.typography.presets.body, color: theme.colors.text.primary, flex: 1 },
    tipBlock: { gap: theme.spacing.xs },
    tip: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    section: { gap: theme.spacing.md },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    planCard: { gap: theme.spacing.md },
    planRow: { gap: theme.spacing.xs },
    planDays: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
    planPhase: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    planFocus: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    bookRow: { gap: theme.spacing.xs },
    bookTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
  });
}
