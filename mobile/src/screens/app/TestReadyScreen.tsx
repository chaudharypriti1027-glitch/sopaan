import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '../../components';
import {
  TestReadyActionBar,
  TestReadyHero,
  TestReadyStatsCard,
  TestReadyTipCard,
} from '../../components/testReady';
import { RESULT_UI } from '../../components/result/resultTheme';
import { PRACTICE_UI } from '../../components/practice/practiceTheme';
import { useTest } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { pickMotivationIndex, pickTipIndices } from '../../utils/testReadyContent';
import { useTheme } from '../../theme';

type TestReadyRoute = RouteProp<MainStackParamList, 'TestReady'>;
type TestReadyNav = NativeStackNavigationProp<MainStackParamList, 'TestReady'>;

const FOOTER_SPACE = 148;

function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins}m`;
}

export function TestReadyScreen() {
  const route = useRoute<TestReadyRoute>();
  const navigation = useNavigation<TestReadyNav>();
  const { theme } = useTheme();
  const { t } = useTranslation('app');

  const { testId, subject, topic, difficulty, examTag, questionCount } = route.params;
  const { data: test, isLoading, isError } = useTest(testId);

  const resolvedSubject = test?.subject ?? subject ?? '';
  const resolvedTopic = test?.topic ?? topic ?? '';
  const resolvedExam = test?.examTag ?? examTag ?? '';
  const resolvedDifficulty = test?.difficulty ?? difficulty ?? 'medium';
  const resolvedCount = test?.questionCount ?? questionCount ?? test?.questions?.length ?? 0;
  const resolvedTitle = test?.title ?? t('testReady.defaultTitle');
  const durationSec =
    test?.durationSec ??
    (resolvedCount > 0
      ? resolvedCount * 60
      : test?.durationMinutes
        ? test.durationMinutes * 60
        : 600);

  const seed = `${testId}:${resolvedTopic}:${resolvedSubject}`;
  const motivationIndex = useMemo(() => pickMotivationIndex(seed), [seed]);
  const tipIndices = useMemo(() => pickTipIndices(seed, 4), [seed]);

  const motivation = t(`testReady.motivation${motivationIndex + 1}`);
  const tips = tipIndices.map((index) => t(`testReady.tip${index + 1}`));

  const difficultyLabel =
    resolvedDifficulty === 'easy'
      ? t('practice.difficultyEasy')
      : resolvedDifficulty === 'hard'
        ? t('practice.difficultyHard')
        : t('practice.difficultyMedium');

  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const startTest = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('Quiz', { testId });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <LinearGradient
          colors={[PRACTICE_UI.headerStart, PRACTICE_UI.headerEnd]}
          style={styles.loadingOrb}
        />
        <ActivityIndicator size="large" color={RESULT_UI.gold} />
        <Text style={styles.loadingText}>{t('testReady.loading')}</Text>
      </View>
    );
  }

  if (isError || !test) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>{t('testReady.loadFailed')}</Text>
        <Button label={t('testReady.startAnyway')} onPress={startTest} variant="gold" fullWidth />
        <Button label={t('testReady.back')} onPress={() => navigation.goBack()} variant="ghost" fullWidth />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TestReadyHero
          badgeLabel={t('testReady.badge')}
          motivation={motivation}
          title={resolvedTitle}
          subtitle={t('testReady.subtitle', {
            count: resolvedCount,
            topic: resolvedTopic || resolvedSubject,
            exam: resolvedExam || t('testReady.yourExam'),
          })}
          questionCount={resolvedCount}
          questionsLabel={t('testReady.questionsShort')}
          examTag={resolvedExam}
          subject={resolvedSubject}
          topic={resolvedTopic}
          backLabel={t('testReady.back')}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <TestReadyStatsCard
            questionCount={resolvedCount}
            questionsLabel={t('testReady.statQuestions')}
            durationLabel={formatDuration(durationSec)}
            durationCaption={t('testReady.statTime')}
            difficultyLabel={difficultyLabel}
            levelCaption={t('testReady.statLevel')}
            aiLabel={t('testReady.statAi')}
          />
          <TestReadyTipCard title={t('testReady.tipsTitle')} tips={tips} />
        </View>
      </ScrollView>

      <TestReadyActionBar
        startLabel={t('testReady.startNow')}
        laterLabel={t('testReady.later')}
        onStart={startTest}
        onLater={() => navigation.goBack()}
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: PRACTICE_UI.bg,
    },
    scroll: {
      paddingBottom: FOOTER_SPACE + theme.spacing.xl,
    },
    body: {
      marginTop: RESULT_UI.bodyLift,
      paddingHorizontal: RESULT_UI.horizontalPad,
      gap: 14,
      zIndex: 5,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 28,
      backgroundColor: PRACTICE_UI.bg,
    },
    loadingOrb: {
      width: 72,
      height: 72,
      borderRadius: 36,
      opacity: 0.35,
      marginBottom: 4,
    },
    loadingText: {
      fontSize: 15,
      color: PRACTICE_UI.muted,
      fontWeight: '700',
    },
    errorText: {
      fontSize: 16,
      color: PRACTICE_UI.ink,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
    },
  });
}
