import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PracticeEmptyState,
  PracticeGenerateCta,
  PracticeGoalHub,
  PracticeHeader,
  PracticeSectionHeader,
  PracticeTabBar,
  PracticeTestList,
  PracticeLoadingList,
  PRACTICE_UI,
  avatarToneForIndex,
  type PracticeTab,
} from '../../components/practice';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useExamPlan, useProfile, useTests } from '../../hooks';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import type { AppTabParamList, MainStackParamList } from '../../navigation/types';
import type { TestSummary } from '../../api/types';
import { PREMIUM } from '../../components/premium';

type PracticeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Practice'>,
  NativeStackNavigationProp<MainStackParamList>
>;

function avatarLabelForTest(test: TestSummary, tab: PracticeTab): string {
  if (tab === 'pyq') {
    const yearMatch = test.title.match(/\b(20\d{2})\b/);
    if (yearMatch) return yearMatch[1];
    return test.title.slice(0, 4).toUpperCase();
  }
  const source = test.subject ?? test.title;
  return source.trim().charAt(0).toUpperCase() || '?';
}

function formatTestRow(test: TestSummary, tab: PracticeTab, t: ReturnType<typeof useTranslation>['t']) {
  const durationMin = test.durationSec
    ? Math.round(test.durationSec / 60)
    : test.durationMinutes ?? 15;

  const metaParts = [
    test.questionCount != null ? t('practice.questionCount', { count: test.questionCount }) : null,
    typeof durationMin === 'number'
      ? t('practice.durationMin', { count: durationMin })
      : t('practice.durationMin', { count: Number(durationMin) || 15 }),
  ].filter(Boolean);

  if (tab === 'pyq') {
    return {
      id: test.id,
      title: test.title,
      titleMuted: undefined as string | undefined,
      meta: metaParts.join(' · '),
    };
  }

  const difficulty = test.difficulty ?? 'medium';
  const subject = test.subject ?? test.title;
  const topic = test.topic ?? test.title;

  return {
    id: test.id,
    title: subject,
    titleMuted: `${topic} (${difficulty})`,
    meta: metaParts.join(' · '),
  };
}

export function PracticeScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<PracticeNav>();
  const route = useRoute<RouteProp<AppTabParamList, 'Practice'>>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);
  const { data: profile } = useProfile();

  const hasGoal = Boolean(profile?.profile.goal?.examTrack);
  const examTag = profile?.profile.goal?.examTrack;
  const examPlanQuery = useExamPlan(hasGoal);

  const testFilters = useMemo(
    () => ({ limit: 10, ...(examTag ? { examTag } : {}) }),
    [examTag],
  );

  const mockQuery = useTests({ type: 'mock', ...testFilters });
  const sectionalQuery = useTests({ type: 'sectional', ...testFilters });
  const pyqQuery = useTests({ type: 'pyq', ...testFilters });

  const [activeTab, setActiveTab] = useState<PracticeTab>('sectional');

  const openGenerate = (prefill?: { subject?: string; topic?: string }) => {
    navigation.getParent()?.navigate('GenerateTest', prefill);
  };

  useEffect(() => {
    const params = route.params;
    if (!params) {
      return;
    }

    if (params.activeTab) {
      setActiveTab(params.activeTab);
    }

    const prefillTopic = params.topic?.trim() || params.weakTopics?.[0];
    if (prefillTopic || params.openForm) {
      navigation.getParent()?.navigate('GenerateTest', {
        ...(prefillTopic ? { topic: prefillTopic } : {}),
        ...(params.subject?.trim() ? { subject: params.subject } : {}),
      });
    }

    navigation.setParams({
      topic: undefined,
      subject: undefined,
      activeTab: undefined,
      openForm: undefined,
      weakTopics: undefined,
    });
  }, [navigation, route.params]);

  const openQuiz = (testId: string) => {
    navigation.getParent()?.navigate('Quiz', { testId });
  };

  const activeQuery =
    activeTab === 'sectional' ? sectionalQuery : activeTab === 'mock' ? mockQuery : pyqQuery;

  const activeItems = useMemo(() => activeQuery.data?.items ?? [], [activeQuery.data]);
  const activeTotal = activeQuery.data?.pagination?.total ?? activeItems.length;

  const testRows = useMemo(
    () =>
      activeItems.map((test, index) => {
        const row = formatTestRow(test, activeTab, t);
        return {
          ...row,
          avatarLabel: avatarLabelForTest(test, activeTab),
          avatarTone: avatarToneForIndex(index),
        };
      }),
    [activeItems, activeTab, t],
  );

  const examName = examPlanQuery.data?.goal.examName ?? profile?.profile.goal?.examTrack ?? '';

  const sectionTitle =
    activeTab === 'sectional'
      ? t('practice.sectionalTests')
      : activeTab === 'mock'
        ? t('practice.mockTests')
        : t('practice.pyqTests');

  const countLabel =
    activeTab === 'pyq'
      ? t('practice.papersCount', { count: activeTotal })
      : t('practice.testsCount', { count: activeTotal });

  const tabs = useMemo(
    () => [
      { key: 'sectional' as const, label: t('practice.tabSectional') },
      { key: 'mock' as const, label: t('practice.tabMock') },
      { key: 'pyq' as const, label: t('practice.tabPyq') },
    ],
    [t],
  );

  const onRefresh = () => {
    void Promise.all([
      sectionalQuery.refetch(),
      mockQuery.refetch(),
      pyqQuery.refetch(),
      examPlanQuery.refetch(),
    ]);
  };

  const isRefreshing =
    sectionalQuery.isRefetching || mockQuery.isRefetching || pyqQuery.isRefetching;

  const subtitle = hasGoal
    ? t('practice.subtitleWithExam', { exam: examName || examTag })
    : t('practice.subtitle');

  const openExamPlan = () => navigation.getParent()?.navigate('ExamPlan');
  const openGames = () => navigation.getParent()?.navigate('Games');
  const openAskAi = () => navigateToAskAI(navigation);
  const openProfile = () => navigation.navigate('Profile');

  const renderEmpty = () => {
    if (activeQuery.isError) {
      return (
        <PracticeEmptyState
          title={t('practice.loadFailed')}
          description={getUserFacingMessage(activeQuery.error)}
          actionLabel={t('practice.retry')}
          onAction={() => void activeQuery.refetch()}
        />
      );
    }

    if (activeTab === 'mock') {
      return (
        <PracticeEmptyState
          title={t('practice.noMockTitle')}
          description={t('practice.noMockDesc')}
          actionLabel={t('practice.emptyGenerate')}
          onAction={() => openGenerate()}
          secondaryActionLabel={t('practice.askAiHelp')}
          onSecondaryAction={openAskAi}
        />
      );
    }

    if (activeTab === 'pyq') {
      return (
        <PracticeEmptyState
          title={t('practice.noPyqTitle')}
          description={t('practice.noPyqDesc', { exam: examName || examTag || t('practice.defaultExam') })}
          actionLabel={t('practice.emptyGenerate')}
          onAction={() => openGenerate()}
          secondaryActionLabel={t('practice.openExamPlan')}
          onSecondaryAction={openExamPlan}
        />
      );
    }

    return (
      <PracticeEmptyState
        title={t('practice.noTestsTitle')}
        description={t('practice.noTests')}
        actionLabel={t('practice.emptyGenerate')}
        onAction={() => openGenerate()}
        secondaryActionLabel={t('practice.askAiHelp')}
        onSecondaryAction={openAskAi}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F6F1E6', '#F3EEE1', '#EDE7D8']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={PRACTICE_UI.startEnd} />
        }
      >
        <PracticeHeader
          title={t('practice.title')}
          subtitle={subtitle}
          aiCard={
            <PracticeGenerateCta
              title={t('practice.aiPrompt')}
              hint={t('practice.configureHint')}
              onPress={() => openGenerate()}
            />
          }
        />

        <View style={styles.body}>
          {!hasGoal ? (
            <PracticeGoalHub
              hasGoal={false}
              setGoalTitle={t('practice.setGoalTitle')}
              setGoalBody={t('practice.setGoalBody')}
              setGoalAction={t('practice.setGoalAction')}
              examPlanLabel={t('practice.openExamPlan')}
              askAiLabel={t('practice.askAiHelp')}
              gamesLabel={t('practice.openGames')}
              onSetGoal={openProfile}
              onExamPlan={openExamPlan}
              onAskAi={openAskAi}
              onGames={openGames}
            />
          ) : null}

          <PracticeTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <PracticeSectionHeader label={sectionTitle} countLabel={activeTotal > 0 ? countLabel : undefined} />

          {activeQuery.isLoading ? (
            <PracticeLoadingList />
          ) : activeItems.length ? (
            <PracticeTestList
              key={activeTab}
              tests={testRows}
              startLabel={t('practice.startBtn')}
              onStart={openQuiz}
            />
          ) : (
            renderEmpty()
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(bottomInset: number) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: PRACTICE_UI.bg,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: PREMIUM.tabBottomPadding + bottomInset,
    },
    body: {
      paddingHorizontal: 16,
      paddingTop: 20,
      gap: 18,
    },
  });
}
