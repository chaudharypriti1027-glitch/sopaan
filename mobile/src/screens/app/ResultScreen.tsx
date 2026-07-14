import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReferralDashboard } from '../../hooks';
import type { SubmitTestResponse, TestDetail } from '../../api/types';
import {
  Button,
  Card,
  QuizOption,
  RelatedQuestions,
  Screen,
  Text,
} from '../../components';
import {
  ResultActionBar,
  ResultCoachPanel,
  ResultExplanationBlock,
  ResultHero,
  ResultRankRow,
  ResultRewardRow,
  ResultSectionLabel,
  ResultSummaryCard,
  ResultTopicBreakdown,
  RESULT_UI,
} from '../../components/result';
import { queryKeys } from '../../hooks/queryKeys';
import { useFormat } from '../../i18n/useFormat';
import type { MainStackParamList } from '../../navigation/types';
import { captureAndShareCard } from '../../share/captureAndShareCard';
import { shareResultReport } from '../../share/shareResultReport';
import { ShareMilestoneCard } from '../../share/ShareMilestoneCard';
import type { ShareCardData } from '../../share/types';
import { shareCardTokens } from '../../share/cardTokens';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../theme';

type ResultNav = NativeStackNavigationProp<MainStackParamList, 'Result'>;
type ReviewAnswer = SubmitTestResponse['answers'][number];

type ResultRewards = {
  xpAwarded?: number;
  coinsAwarded?: number;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const ReviewAnswerCard = memo(function ReviewAnswerCard({
  item,
  index,
}: {
  item: ReviewAnswer;
  index: number;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createReviewStyles(theme), [theme]);
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
        <ResultExplanationBlock
          explanation={item.question.explanation}
          correctKey={correctKey}
          selectedKey={item.selectedKey}
          wasCorrect={item.correct}
          solutionLabel={t('result.solutionLabel')}
          yourAnswerLabel={t('result.yourAnswer')}
          correctLabel={t('result.correctStatus')}
          wrongLabel={t('result.wrongStatus')}
          correctAnswerLabel={t('result.correctAnswer')}
          formulaLabel={t('askAi.formula')}
        />
      ) : null}
      {!item.correct && item.questionId ? (
        <RelatedQuestions questionId={item.questionId} limit={3} />
      ) : null}
    </Card>
  );
});

function ResultUnavailable() {
  const navigation = useNavigation<ResultNav>();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createReviewStyles(theme), [theme]);

  return (
    <Screen scroll contentContainerStyle={styles.errorContent}>
      <Card style={styles.errorCard}>
        <Text style={styles.errorTitle}>{t('result.unavailable')}</Text>
        <Text style={styles.errorBody}>{t('result.unavailableHint')}</Text>
        <Button label={t('result.backToPractice')} onPress={() => navigation.goBack()} fullWidth />
      </Card>
    </Screen>
  );
}

function ResultScreenContent({ params }: { params: MainStackParamList['Result'] }) {
  const navigation = useNavigation<ResultNav>();
  const queryClient = useQueryClient();
  const profileName = useAuthStore((state) => state.profile?.name);
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatNumber, formatPercent, formatOrdinal } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList<ReviewAnswer>>(null);
  const reviewY = useRef(0);
  const shareCardRef = useRef<View>(null);

  const { result, previousRank, attemptId, testId } = params;
  const { attempt, coaching, answers } = result;

  const testDetail = queryClient.getQueryData<TestDetail>(queryKeys.tests.detail(testId));
  const testTitle = testDetail?.title ?? t('result.defaultTestTitle');

  const totalQuestions = answers.length;
  const correctCount = answers.filter((item) => item.correct).length;
  const skippedCount = answers.filter((item) => !item.selectedKey).length;
  const wrongCount = Math.max(0, totalQuestions - correctCount - skippedCount);
  const durationLabel = formatDuration(attempt.totalTimeSec ?? 0);

  const rewards = result.rewards as ResultRewards | undefined;
  const xpEarned = rewards?.xpAwarded ?? attempt.score * 5;
  const coinsEarned = rewards?.coinsAwarded ?? Math.max(5, attempt.score * 2);

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

  const shareData = useMemo<ShareCardData>(
    () => ({
      kind: 'rank',
      userName: profileName ?? t('result.sopaanStudent'),
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
    }),
    [
      attempt.accuracy,
      attempt.percentile,
      attempt.rank,
      attempt.score,
      formatNumber,
      formatOrdinal,
      formatPercent,
      profileName,
      rankChange,
      t,
      totalQuestions,
    ],
  );

  const referralQuery = useReferralDashboard();

  const handleShare = useCallback(async () => {
    try {
      await captureAndShareCard(shareCardRef, shareData, {
        webLink: referralQuery.data?.webLink,
        code: referralQuery.data?.code,
      });
    } catch (err) {
      Alert.alert(
        t('result.shareErrorTitle'),
        err instanceof Error ? err.message : t('result.shareErrorMessage'),
      );
    }
  }, [referralQuery.data?.code, referralQuery.data?.webLink, shareData, t]);

  const handleDownloadReport = useCallback(async () => {
    try {
      await shareResultReport({
        testTitle,
        subject: testDetail?.subject,
        topic: testDetail?.topic,
        examTag: testDetail?.examTag,
        result,
      });
    } catch (err) {
      Alert.alert(
        t('result.reportErrorTitle'),
        err instanceof Error ? err.message : t('result.reportErrorMessage'),
      );
    }
  }, [result, t, testDetail?.examTag, testDetail?.subject, testDetail?.topic, testTitle]);

  const handleReviewLayout = useCallback((event: LayoutChangeEvent) => {
    reviewY.current = event.nativeEvent.layout.y;
  }, []);

  const scrollToReview = useCallback(() => {
    if (answers.length > 8) {
      flatListRef.current?.scrollToIndex({ index: 0, animated: true, viewPosition: 0 });
      return;
    }
    scrollRef.current?.scrollTo({ y: reviewY.current, animated: true });
  }, [answers.length]);

  const renderReviewItem = useCallback(
    ({ item, index }: { item: ReviewAnswer; index: number }) => (
      <View style={styles.reviewItemPad}>
        <ReviewAnswerCard item={item} index={index} />
      </View>
    ),
    [styles.reviewItemPad],
  );

  const mainBody = (
    <>
      <ResultHero
        accuracy={attempt.accuracy}
        testTitle={testTitle}
        correct={correctCount}
        total={totalQuestions}
        durationLabel={durationLabel}
        onBack={() => navigation.goBack()}
        onShare={() => void handleShare()}
      />

      <View style={styles.body}>
        <ResultSummaryCard
          correct={correctCount}
          wrong={wrongCount}
          skipped={skippedCount}
          durationLabel={durationLabel}
        />

        <ResultRewardRow xp={xpEarned} coins={coinsEarned} />

        <ResultSectionLabel title={t('result.topicBreakdown')} />
        <ResultTopicBreakdown items={topicStats} />

        <ResultRankRow rank={attempt.rank} percentile={attempt.percentile} />

        <ResultSectionLabel title={t('result.aiCoach')} />
        <ResultCoachPanel
          feedback={coaching.feedback}
          weakTopics={coaching.weakTopics}
          actions={coaching.actions}
          onPracticePress={() =>
            navigation.navigate('AppTabs', {
              screen: 'Practice',
              params: {
                weakTopics: coaching.weakTopics,
                openForm: true,
              },
            })
          }
        />

        <ResultActionBar
          onReview={scrollToReview}
          onRetake={() => navigation.replace('Quiz', { testId })}
          onMoreTests={() => navigation.navigate('AppTabs', { screen: 'Practice' })}
          onMockAnalysis={() => navigation.navigate('MockAnalysis', { attemptId })}
          onDownloadReport={() => void handleDownloadReport()}
        />
      </View>

      <View style={styles.reviewSection} onLayout={handleReviewLayout}>
        <ResultSectionLabel title={t('result.reviewAnswers')} />
      </View>
    </>
  );

  const shareCard = (
    <View style={styles.offscreen} pointerEvents="none">
      <View ref={shareCardRef} collapsable={false}>
        <ShareMilestoneCard
          {...shareData}
          referralLink={referralQuery.data?.webLink}
          referralCode={referralQuery.data?.code}
        />
      </View>
    </View>
  );

  if (answers.length > 8) {
    return (
      <>
        <Screen scroll={false} padded={false} style={styles.root}>
          <FlatList
            ref={flatListRef}
            data={answers}
            renderItem={renderReviewItem}
            keyExtractor={(item, index) => `${item.questionId}-${index}`}
            ListHeaderComponent={<View>{mainBody}</View>}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
            showsVerticalScrollIndicator={false}
          />
        </Screen>
        {shareCard}
      </>
    );
  }

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.root}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + theme.spacing['4xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {mainBody}
        <View style={styles.reviewList}>
          {answers.map((item, index) => (
            <ReviewAnswerCard key={`${item.questionId}-${index}`} item={item} index={index} />
          ))}
        </View>
      </ScrollView>
      {shareCard}
    </>
  );
}

export function ResultScreen() {
  const route = useRoute();
  const params = route.params as MainStackParamList['Result'] | undefined;

  if (!params?.result?.attempt || !Array.isArray(params.result.answers)) {
    return <ResultUnavailable />;
  }

  return <ResultScreenContent params={params} />;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      backgroundColor: RESULT_UI.bg,
    },
    scrollContent: {
      paddingTop: 0,
      paddingHorizontal: 0,
      paddingBottom: theme.spacing['4xl'],
    },
    body: {
      marginTop: RESULT_UI.bodyLift,
      paddingHorizontal: RESULT_UI.horizontalPad,
      zIndex: 5,
    },
    reviewSection: {
      paddingHorizontal: RESULT_UI.horizontalPad,
    },
    reviewList: {
      paddingHorizontal: RESULT_UI.horizontalPad,
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    reviewSeparator: {
      height: theme.spacing.md,
    },
    listContent: {
      paddingBottom: theme.spacing['4xl'],
    },
    reviewItemPad: {
      paddingHorizontal: RESULT_UI.horizontalPad,
    },
    offscreen: {
      position: 'absolute',
      top: -shareCardTokens.height - 100,
      left: -shareCardTokens.width - 100,
      opacity: 0,
    },
    errorContent: {
      padding: theme.spacing.lg,
    },
  });
}

function createReviewStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    errorContent: {
      padding: theme.spacing.lg,
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
