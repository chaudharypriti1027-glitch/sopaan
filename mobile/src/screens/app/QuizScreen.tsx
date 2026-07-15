import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bookmark } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  ProgressBar,
  QuestionPalette,
  QuizOption,
  QuizTimer,
  Screen,
} from '../../components';
import { attemptsApi } from '../../api';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useSubmitTest, useTest, useProGate } from '../../hooks';
import { useScreenPerf } from '../../perf';
import type { MainStackParamList } from '../../navigation/types';
import type { TestQuestion } from '../../api/types';
import { useTheme } from '../../theme';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/queryKeys';

type QuizRoute = RouteProp<MainStackParamList, 'Quiz'>;
type QuizNav = NativeStackNavigationProp<MainStackParamList, 'Quiz'>;

type AnswerState = {
  selectedKey?: string;
  timeSec: number;
};

export function QuizScreen() {
  const route = useRoute<QuizRoute>();
  const navigation = useNavigation<QuizNav>();
  const { testId } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation(['app', 'common']);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: test, isLoading, isError } = useTest(testId);
  const submitTest = useSubmitTest(testId);
  const queryClient = useQueryClient();
  const { handleProError } = useProGate();

  useScreenPerf('Quiz', {
    isContentReady: !isLoading && Boolean(test),
    isInteractive: !isLoading && Boolean(test),
  });

  const questions = useMemo(() => test?.questions ?? [], [test]);
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [reviewSet, setReviewSet] = useState<Set<number>>(new Set());
  const [showPalette, setShowPalette] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const questionStartedAt = useRef(Date.now());
  const submitOnExpireRef = useRef<() => void>(() => {});

  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, [currentIndex]);

  const currentQuestion: TestQuestion | undefined = questions[currentIndex];

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, index) => {
      if (answers[q.id]?.selectedKey) set.add(index);
    });
    return set;
  }, [answers, questions]);

  const recordTimeForCurrent = useCallback(() => {
    if (!currentQuestion) return 0;
    const elapsed = Math.round((Date.now() - questionStartedAt.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        selectedKey: prev[currentQuestion.id]?.selectedKey,
        timeSec: (prev[currentQuestion.id]?.timeSec ?? 0) + elapsed,
      },
    }));
    return elapsed;
  }, [currentQuestion]);

  const selectOption = (key: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        selectedKey: key,
        timeSec: prev[currentQuestion.id]?.timeSec ?? 0,
      },
    }));
  };

  const toggleReview = () => {
    setReviewSet((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  const goNext = () => {
    recordTimeForCurrent();
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const doSubmit = useCallback(async (payload: {
    answers: { questionId: string; selectedKey?: string; timeSec?: number }[];
  }) => {
    setSubmitError(null);
    try {
      let previousRank: number | undefined;
      try {
        const priorAttempts = await queryClient.fetchQuery({
          queryKey: queryKeys.attempts.list({ limit: 20 }),
          queryFn: () => attemptsApi.listAttempts({ limit: 20 }),
        });

        previousRank = priorAttempts?.items.find((a) => {
          const tid =
            (a.test as { id?: string; _id?: string })?.id ??
            (a.test as { _id?: string })?._id;
          return tid === testId;
        })?.rank;
      } catch {
        // Rank comparison is optional and must never prevent a test submission.
      }

      const result = await submitTest.mutateAsync(payload);

      if (!result?.attempt?.id) {
        throw new Error('Invalid submit response');
      }

      navigation.replace('Result', {
        attemptId: result.attempt.id,
        testId,
        previousRank,
        result,
      });
    } catch (error) {
      if (handleProError(error)) {
        return;
      }
      setSubmitError(getUserFacingMessage(error));
    }
  }, [handleProError, navigation, queryClient, submitTest, testId]);

  const handleSubmit = useCallback(async () => {
    const elapsed = currentQuestion
      ? Math.round((Date.now() - questionStartedAt.current) / 1000)
      : 0;
    const snapshot = currentQuestion
      ? {
          ...answers,
          [currentQuestion.id]: {
            selectedKey: answers[currentQuestion.id]?.selectedKey,
            timeSec: (answers[currentQuestion.id]?.timeSec ?? 0) + elapsed,
          },
        }
      : answers;

    setAnswers(snapshot);
    questionStartedAt.current = Date.now();

    const payload = {
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedKey: snapshot[q.id]?.selectedKey,
        timeSec: snapshot[q.id]?.timeSec ?? 0,
      })),
    };

    const unanswered = payload.answers.filter((a) => !a.selectedKey).length;
    if (unanswered > 0) {
      Alert.alert(
        t('app:quiz.submitConfirmTitle'),
        t('app:quiz.submitConfirmBody', { count: unanswered }),
        [
          { text: t('app:quiz.review'), style: 'cancel' },
          { text: t('common:submit'), onPress: () => void doSubmit(payload) },
        ],
      );
      return;
    }

    await doSubmit(payload);
  }, [answers, currentQuestion, doSubmit, questions, t]);

  submitOnExpireRef.current = () => {
    if (totalQuestions > 0 && !submitTest.isPending) {
      void handleSubmit();
    }
  };

  const handleTimerExpire = useCallback(() => {
    submitOnExpireRef.current();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  if (isError || !test) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('app:quiz.loadFailed')}</Text>
        <Button label={t('app:quiz.goBack')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('app:quiz.emptyTest')}</Text>
        <Button label={t('app:quiz.goBack')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const selectedKey = answers[currentQuestion.id]?.selectedKey;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Card style={styles.topBar} padded={false}>
        <View style={styles.topCenter}>
          <Text style={styles.testTitle} numberOfLines={1}>
            {test.title ?? currentQuestion.subject}
          </Text>
          <Text style={styles.progress}>
            {t('app:quiz.questionOf', { current: currentIndex + 1, total: totalQuestions })}
          </Text>
        </View>
        <QuizTimer totalSec={test.durationSec ?? 0} onExpire={handleTimerExpire} />
      </Card>

      <ProgressBar
        value={((currentIndex + 1) / totalQuestions) * 100}
        max={100}
        showValue={false}
        variant="gold"
        height={7}
      />

      <Card style={styles.questionCard} padded>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>{currentIndex + 1}</Text>
        </View>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
      </Card>

      <View style={styles.options}>
        {currentQuestion.options.map((option) => (
          <QuizOption
            key={option.key}
            indexLabel={option.key}
            label={option.text}
            state={selectedKey === option.key ? 'selected' : 'default'}
            onPress={() => selectOption(option.key)}
          />
        ))}
      </View>

      {showPalette ? (
        <QuestionPalette
          total={totalQuestions}
          currentIndex={currentIndex}
          answeredIndices={answeredIndices}
          reviewIndices={reviewSet}
          onSelect={(index) => {
            recordTimeForCurrent();
            setCurrentIndex(index);
          }}
        />
      ) : null}

      <View style={styles.footer}>
        {submitError ? (
          <Card style={styles.submitErrorCard}>
            <Text style={styles.submitErrorTitle}>{t('app:quiz.submitFailed')}</Text>
            <Text style={styles.submitErrorBody}>{submitError}</Text>
            <Text style={styles.submitErrorHint}>{t('app:quiz.submitRetry')}</Text>
          </Card>
        ) : null}

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: reviewSet.has(currentIndex) }}
          accessibilityLabel={
            reviewSet.has(currentIndex)
              ? t('app:quiz.markReviewSelectedA11y')
              : t('app:quiz.markReviewA11y')
          }
          onPress={toggleReview}
          style={styles.reviewBtn}
        >
          <Bookmark
            size={18}
            color={reviewSet.has(currentIndex) ? theme.colors.accent.gold : theme.colors.text.secondary}
            fill={reviewSet.has(currentIndex) ? theme.colors.accent.goldMuted : 'transparent'}
          />
          <Text style={styles.reviewLabel}>{t('app:quiz.markReview')}</Text>
        </Pressable>

        <View style={styles.footerActions}>
          <Button
            label={t('app:quiz.palette')}
            variant="ghost"
            size="sm"
            onPress={() => setShowPalette((v) => !v)}
          />
          {isLast ? (
            <Button
              label={t('common:submit')}
              testID="quiz-submit"
              loading={submitTest.isPending}
              onPress={handleSubmit}
            />
          ) : (
            <Button label={t('common:next')} testID="quiz-next" onPress={goNext} disabled={!selectedKey} />
          )}
        </View>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing['4xl'],
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.lg,
      backgroundColor: theme.colors.background.primary,
    },
    errorText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    topCenter: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    testTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    progress: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    questionCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.accent.goldMuted,
      borderWidth: 0,
    },
    questionBadge: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent.gold,
      flexShrink: 0,
    },
    questionBadgeText: {
      ...theme.typography.presets.label,
      fontFamily: theme.typography.fonts.ui.bold,
      color: theme.colors.accent.goldOn,
    },
    questionText: {
      flex: 1,
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      lineHeight: theme.typography.scale.fontSize.md * 1.5,
    },
    options: {
      gap: theme.spacing.sm,
    },
    footer: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    reviewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    reviewLabel: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.secondary,
    },
    footerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    submitErrorCard: {
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.semantic.errorMuted,
      borderColor: theme.colors.semantic.error,
      borderWidth: 1,
    },
    submitErrorTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.semantic.error,
    },
    submitErrorBody: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
    },
    submitErrorHint: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
  });
}
