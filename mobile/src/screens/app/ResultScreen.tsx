import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth';
import {
  AIBadge,
  AIGoldCard,
  Button,
  Card,
  Eyebrow,
  Pill,
  ProgressBar,
  QuizOption,
  RankRing,
  RelatedQuestions,
  Screen,
  SectionTitle,
  ShareMilestoneButton,
} from '../../components';
import type { MainStackParamList } from '../../navigation/types';
import type { SubmitTestResponse } from '../../api/types';
import { useTheme } from '../../theme';
import { useFormat } from '../../i18n/useFormat';

type ResultNav = NativeStackNavigationProp<MainStackParamList, 'Result'>;
type ReviewAnswer = SubmitTestResponse['answers'][number];

const ReviewAnswerCard = memo(function ReviewAnswerCard({
  item,
  index,
}: {
  item: ReviewAnswer;
  index: number;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const correctKey = item.question?.correctKey;
  const options = item.question?.options ?? [];

  return (
    <Card style={styles.reviewCard}>
      <Text style={styles.reviewQ}>
        Q{index + 1}. {item.question?.text ?? t('result.questionLabel')}
      </Text>
      <View style={styles.reviewOptions}>
        {options.map((opt) => {
          let state: 'default' | 'selected' | 'correct' | 'wrong' = 'default';
          if (opt.key === correctKey) state = 'correct';
          else if (opt.key === item.selectedKey && !item.correct) state = 'wrong';
          else if (opt.key === item.selectedKey) state = 'selected';
          return (
            <QuizOption
              key={opt.key}
              indexLabel={opt.key}
              label={opt.text}
              state={state}
              disabled
            />
          );
        })}
      </View>
      {item.question?.explanation ? (
        <Text style={styles.explanation}>{item.question.explanation}</Text>
      ) : null}
      {!item.correct && item.questionId ? (
        <RelatedQuestions questionId={item.questionId} limit={3} />
      ) : null}
    </Card>
  );
});

export function ResultScreen() {
  const route = useRoute();
  const navigation = useNavigation<ResultNav>();
  const params = route.params as MainStackParamList['Result'] | undefined;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatNumber, formatPercent, formatOrdinal } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!params?.result?.attempt || !Array.isArray(params.result.answers)) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t('result.unavailable')}</Text>
          <Text style={styles.errorBody}>{t('result.unavailableHint')}</Text>
          <Button label={t('result.backToPractice')} onPress={() => navigation.goBack()} fullWidth />
        </Card>
      </Screen>
    );
  }

  const { result, previousRank, attemptId } = params;

  const { attempt, coaching, answers } = result;
  const totalQuestions = answers.length;
  const rankChange =
    previousRank != null && attempt.rank != null ? previousRank - attempt.rank : null;

  const topicStats = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const item of answers) {
      const topic = item.question?.topic ?? item.question?.subject ?? t('result.general');
      const entry = map.get(topic) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (item.correct) entry.correct += 1;
      map.set(topic, entry);
    }
    return [...map.entries()].map(([topic, stats]) => ({
      topic,
      pct: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));
  }, [answers, t]);

  const renderReviewItem = useCallback(
    ({ item, index }: { item: ReviewAnswer; index: number }) => (
      <ReviewAnswerCard item={item} index={index} />
    ),
    [],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.content}>
        <View style={styles.heroHeader}>
          <Eyebrow>{t('result.completeEyebrow')}</Eyebrow>
          <Text style={styles.heroTitle}>{t('result.title')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('result.scoreSubtitle', { score: attempt.score, total: totalQuestions })}
          </Text>
        </View>

        <View style={styles.heroRingWrap}>
          <RankRing
            value={attempt.accuracy}
            max={100}
            label={t('result.accuracy')}
            size={120}
            variant="teal"
          />
        </View>

        <View style={styles.statPills}>
          {rankChange != null && rankChange !== 0 ? (
            <Pill
              label={
                rankChange > 0
                  ? t('result.placesUp', { count: Math.abs(rankChange) })
                  : t('result.placesDown', { count: Math.abs(rankChange) })
              }
              variant="teal"
            />
          ) : null}
          <Pill
            label={t('result.percentile', { value: attempt.percentile ?? 0 })}
            variant="gold"
          />
          <Pill label={t('result.xpEarned', { count: attempt.score * 5 })} variant="primary" />
        </View>

        <ShareMilestoneButton
          fullWidth
          variant="gold"
          data={{
            kind: 'rank',
            userName: user?.name ?? t('result.sopaanStudent'),
            headline: attempt.rank ? `#${attempt.rank}` : formatPercent(attempt.accuracy, 0),
            subtitle: t('result.accuracyMetric', {
              value: attempt.accuracy,
              score: attempt.score,
              total: totalQuestions,
            }),
            metrics: [
              { label: t('result.accuracy'), value: formatPercent(attempt.accuracy, 0) },
              { label: t('result.percentileLabel'), value: formatOrdinal(attempt.percentile ?? 0) },
              {
                label: t('result.rankChange'),
                value:
                  rankChange != null && rankChange !== 0
                    ? `${rankChange > 0 ? '+' : ''}${formatNumber(rankChange)}`
                    : '—',
              },
            ],
          }}
        />

        <View style={styles.section}>
          <AIGoldCard>
            <AIBadge label={t('result.coachBadge')} />
            <Text style={styles.feedback}>{coaching.feedback}</Text>
            {coaching.weakTopics.length > 0 ? (
              <View style={styles.weakTopics}>
                <Text style={styles.weakLabel}>{t('result.weakTopics')}</Text>
                <Text style={styles.weakList}>{coaching.weakTopics.join(' · ')}</Text>
              </View>
            ) : null}
            <View style={styles.actions}>
              {coaching.actions.map((action) => (
                <Text key={action} style={styles.actionItem}>
                  • {action}
                </Text>
              ))}
            </View>
            <Button
              label={t('result.practiceWeakTopics')}
              variant="gold"
              size="sm"
              fullWidth
              onPress={() => navigation.navigate('AppTabs', { screen: 'Practice' })}
            />
          </AIGoldCard>
        </View>

        <View style={styles.section}>
          <SectionTitle title={t('result.topicBreakdown')} />
          <Card style={styles.breakdown}>
            {topicStats.map((item) => (
              <ProgressBar
                key={item.topic}
                label={item.topic}
                value={item.pct}
                variant={item.pct >= 70 ? 'teal' : item.pct >= 50 ? 'gold' : 'coral'}
                showValue
              />
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionTitle title={t('result.reviewAnswers')} />
        </View>
      </View>
    ),
    [
      attempt,
      coaching,
      navigation,
      rankChange,
      styles,
      topicStats,
      totalQuestions,
      user?.name,
      t,
      formatNumber,
      formatPercent,
    ],
  );

  const listFooter = useMemo(
    () => (
      <View style={styles.footer}>
        <Button
          label={t('result.mockAnalysis')}
          variant="ghost"
          fullWidth
          onPress={() => navigation.navigate('MockAnalysis', { attemptId })}
        />
        <Button
          label={t('result.backToPractice')}
          fullWidth
          size="lg"
          onPress={() => navigation.navigate('AppTabs', { screen: 'Practice' })}
        />
      </View>
    ),
    [attemptId, navigation, styles.footer, t],
  );

  if (answers.length > 8) {
    return (
      <Screen scroll={false} padded={false} style={styles.listRoot}>
        <FlatList
          data={answers}
          renderItem={renderReviewItem}
          keyExtractor={(item, index) => `${item.questionId}-${index}`}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      {listHeader}
      <View style={styles.reviewList}>
        {answers.map((item, index) => (
          <ReviewAnswerCard key={`${item.questionId}-${index}`} item={item} index={index} />
        ))}
      </View>
      {listFooter}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.xl,
      paddingBottom: theme.spacing['4xl'],
    },
    heroHeader: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    heroTitle: {
      ...theme.typography.presets.h2,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    heroSubtitle: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    heroRingWrap: {
      alignItems: 'center',
    },
    statPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    section: {
      gap: theme.spacing.md,
    },
    feedback: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
    },
    weakTopics: {
      gap: theme.spacing.xs,
    },
    weakLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
    },
    weakList: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.semantic.error,
    },
    actions: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.subtle,
    },
    actionItem: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    breakdown: {
      gap: theme.spacing.md,
    },
    reviewList: {
      gap: theme.spacing.md,
    },
    reviewSeparator: {
      height: theme.spacing.md,
    },
    listRoot: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing['4xl'],
    },
    footer: {
      gap: theme.spacing.md,
      paddingTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing['4xl'],
    },
    reviewCard: {
      gap: theme.spacing.md,
    },
    reviewQ: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    reviewOptions: {
      gap: theme.spacing.sm,
    },
    explanation: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
    },
    errorCard: {
      gap: theme.spacing.md,
      alignItems: 'stretch',
    },
    errorTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    errorBody: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}
