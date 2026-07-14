import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp , CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PracticeAiCard,
  type PracticeTestMode,
  PracticeEmptyState,
  PracticeFocusChips,
  PracticeGoalHub,
  PracticeHeader,
  PracticeSectionHeader,
  PracticeStatsRow,
  PracticeTabBar,
  PracticeTestList,
  PracticeLoadingList,
  PRACTICE_UI,
  avatarToneForIndex,
  type PracticeTab,
} from '../../components/practice';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import {
  useAttempts,
  useExamPlan,
  useGenerateTest,
  usePracticeSuggestions,
  useProfile,
  useProGate,
  useReadiness,
  useTests,
} from '../../hooks';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import type { AppTabParamList, MainStackParamList } from '../../navigation/types';
import type { TestSummary } from '../../api/types';
import type { PracticeSuggestion } from '../../api/ai';
import { PREMIUM } from '../../components/premium';
import {
  estimatePracticeDurationMin,
  PRACTICE_QUESTION_COUNTS,
  PRACTICE_SUBJECT_SUGGESTIONS,
} from '../../content/practiceGeneratorContent';
import { TEST_DIFFICULTIES } from '../../content/testBuilderContent';

type PracticeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Practice'>,
  NativeStackNavigationProp<MainStackParamList>
>;

const COUNTS = PRACTICE_QUESTION_COUNTS;

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

function normalizeTopic(value: string) {
  return value
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function PracticeScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<PracticeNav>();
  const route = useRoute<RouteProp<AppTabParamList, 'Practice'>>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);
  const { data: profile } = useProfile();
  const attemptsQuery = useAttempts({ limit: 100 });

  const hasGoal = Boolean(profile?.profile.goal?.examTrack);
  const examTag = profile?.profile.goal?.examTrack;
  const examPlanQuery = useExamPlan(hasGoal);
  const readinessQuery = useReadiness(hasGoal);

  const testFilters = useMemo(
    () => ({ limit: 10, ...(examTag ? { examTag } : {}) }),
    [examTag],
  );

  const mockQuery = useTests({ type: 'mock', ...testFilters });
  const sectionalQuery = useTests({ type: 'sectional', ...testFilters });
  const pyqQuery = useTests({ type: 'pyq', ...testFilters });
  const generateTest = useGenerateTest();
  const practiceSuggestions = usePracticeSuggestions();
  const { handleProError, guardFeature } = useProGate();

  const [activeTab, setActiveTab] = useState<PracticeTab>('sectional');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof TEST_DIFFICULTIES)[number]>('medium');
  const [count, setCount] = useState(10);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [testMode, setTestMode] = useState<PracticeTestMode>('standard');
  const [showForm, setShowForm] = useState(true);

  const applyTopic = useCallback((nextTopic: string, nextSubject?: string) => {
    setTopic(normalizeTopic(nextTopic));
    if (nextSubject?.trim()) {
      setSubject(normalizeTopic(nextSubject));
    }
    setActiveTab('sectional');
    setShowForm(true);
  }, []);

  useEffect(() => {
    const params = route.params;
    if (!params) {
      return;
    }

    if (params.activeTab) {
      setActiveTab(params.activeTab);
    }

    if (params.subject?.trim()) {
      setSubject(normalizeTopic(params.subject));
    }

    if (params.topic?.trim()) {
      applyTopic(params.topic, params.subject);
    }

    if (params.openForm) {
      setShowForm(true);
    }

    if (params.weakTopics?.length) {
      applyTopic(params.weakTopics[0], params.subject);
    }

    navigation.setParams({
      topic: undefined,
      subject: undefined,
      activeTab: undefined,
      openForm: undefined,
      weakTopics: undefined,
    });
  }, [applyTopic, navigation, route.params]);

  const difficultyLabel = (level: (typeof TEST_DIFFICULTIES)[number]) => {
    if (level === 'easy') return t('practice.difficultyEasy');
    if (level === 'hard') return t('practice.difficultyHard');
    return t('practice.difficultyMedium');
  };

  const difficultyLabels = useMemo(
    () =>
      Object.fromEntries(TEST_DIFFICULTIES.map((level) => [level, difficultyLabel(level)])) as Record<
        string,
        string
      >,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const openTestReady = (
    testId: string,
    meta: {
      subject: string;
      topic: string;
      difficulty: (typeof TEST_DIFFICULTIES)[number];
      examTag: string;
      questionCount: number;
    },
  ) => {
    navigation.getParent()?.navigate('TestReady', {
      testId,
      subject: meta.subject,
      topic: meta.topic,
      difficulty: meta.difficulty,
      examTag: meta.examTag,
      questionCount: meta.questionCount,
    });
  };

  const openQuiz = (testId: string) => {
    navigation.getParent()?.navigate('Quiz', { testId });
  };

  const handleGenerate = async () => {
    const trimmedSubject = subject.trim();
    const trimmedTopic = topic.trim();

    if (!trimmedSubject || !trimmedTopic) {
      Alert.alert(t('practice.generateFailed'), t('practice.fillRequired'));
      setShowForm(true);
      return;
    }

    if (!examTag) {
      Alert.alert(t('practice.generateFailed'), t('practice.needGoal'));
      return;
    }

    guardFeature('ai_generate_test', () => {
      void (async () => {
        try {
          const test = await generateTest.mutateAsync({
            subject: trimmedSubject,
            topic: trimmedTopic,
            ...(testMode === 'adaptive' ? { adaptive: true } : { difficulty }),
            count,
            examTag,
            language,
          });
          openTestReady(test.id, {
            subject: trimmedSubject,
            topic: trimmedTopic,
            difficulty: testMode === 'adaptive' ? 'medium' : difficulty,
            examTag,
            questionCount: count,
          });
        } catch (error) {
          if (handleProError(error)) {
            return;
          }
          Alert.alert(t('practice.generateFailed'), getUserFacingMessage(error));
        }
      })();
    });
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

  const attempts = useMemo(() => attemptsQuery.data?.items ?? [], [attemptsQuery.data]);
  const avgScore = useMemo(() => {
    const scored = attempts.filter((item) => item.accuracy != null || item.score != null);
    if (!scored.length) return 0;
    const sum = scored.reduce((acc, item) => acc + (item.accuracy ?? item.score ?? 0), 0);
    return Math.round(sum / scored.length);
  }, [attempts]);

  const streakCount = profile?.user.streak?.count ?? 0;
  const examName = examPlanQuery.data?.goal.examName ?? profile?.profile.goal?.examTrack ?? '';
  const daysLeft = examPlanQuery.data?.goal.daysLeft ?? null;

  const focusTopics = useMemo(() => {
    const fromToday =
      examPlanQuery.data?.today.sessions
        ?.map((session) => session.topic?.trim())
        .filter((value): value is string => Boolean(value)) ?? [];
    const fromReadiness = readinessQuery.data?.focusNext ?? [];
    const fromPlan = examPlanQuery.data?.aiAdvice.focusAreas ?? [];
    return [...new Set([...fromToday, ...fromReadiness, ...fromPlan])].slice(0, 8);
  }, [examPlanQuery.data, readinessQuery.data]);

  const topicSuggestions = useMemo(() => focusTopics.filter((item) => item !== topic.trim()), [focusTopics, topic]);

  const durationHint = t('practice.estimatedDuration', { count: estimatePracticeDurationMin(count) });

  const modeSummary =
    testMode === 'adaptive' ? t('practice.modeAdaptive') : t('practice.modeStandard');

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
      attemptsQuery.refetch(),
      examPlanQuery.refetch(),
      readinessQuery.refetch(),
    ]);
  };

  const isRefreshing =
    sectionalQuery.isRefetching ||
    mockQuery.isRefetching ||
    pyqQuery.isRefetching ||
    examPlanQuery.isRefetching;

  const subtitle = hasGoal
    ? t('practice.subtitleWithExam', { exam: examName || examTag })
    : t('practice.subtitle');

  const openExamPlan = () => navigation.getParent()?.navigate('ExamPlan');
  const openGames = () => navigation.getParent()?.navigate('Games');
  const openAskAi = () =>
    navigateToAskAI(navigation, {
      initialPrompt: t('practice.askAiPrompt', { topic }),
    });
  const openProfile = () => navigation.navigate('Profile');

  const fetchAiSuggestions = () => {
    if (!examTag) {
      Alert.alert(t('practice.generateFailed'), t('practice.needGoal'));
      return;
    }

    practiceSuggestions.mutate({
      examTag,
      subject: subject.trim() || undefined,
      topic: topic.trim() || undefined,
      language,
    });
  };

  const applyAiSuggestion = (suggestion: PracticeSuggestion) => {
    setSubject(normalizeTopic(suggestion.subject));
    setTopic(normalizeTopic(suggestion.topic));
    setDifficulty(suggestion.difficulty);
    setTestMode(suggestion.mode);
    setCount(suggestion.count);
    setShowForm(true);
  };

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
          onAction={() => setShowForm(true)}
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
          onAction={() => setShowForm(true)}
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
        onAction={() => setShowForm(true)}
        secondaryActionLabel={t('practice.askAiHelp')}
        onSecondaryAction={openAskAi}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={PRACTICE_UI.startEnd} />
        }
      >
        <PracticeHeader
          eyebrow={t('practice.eyebrow')}
          title={t('practice.title')}
          subtitle={subtitle}
          aiCard={
            <PracticeAiCard
              badgeLabel={t('practice.aiBadge').toUpperCase()}
              title={t('practice.aiPrompt')}
              subject={subject}
              topic={topic}
              difficulty={difficultyLabel(difficulty)}
              modeSummary={modeSummary}
              countLabel={t('practice.questionCount', { count })}
              durationHint={durationHint}
              tapConfigure={t('practice.tapConfigure')}
              configureHint={t('practice.configureHint')}
              subjectPlaceholder={t('practice.subjectPlaceholder')}
              topicPlaceholder={t('practice.topicPlaceholder')}
              examTagLabel={t('practice.examTagLabel')}
              examTag={examTag}
              modeLabel={t('practice.modeLabel')}
              modeStandardLabel={t('practice.modeStandard')}
              modeAdaptiveLabel={t('practice.modeAdaptive')}
              selectedMode={testMode}
              onModeChange={setTestMode}
              modeHint={t('practice.modeStandardHint')}
              adaptiveHint={t('practice.modeAdaptiveHint')}
              languageLabel={t('practice.languageLabel')}
              languages={[
                { key: 'en', label: t('practice.languageEn') },
                { key: 'hi', label: t('practice.languageHi') },
              ]}
              selectedLanguage={language}
              onLanguageChange={setLanguage}
              subjectSuggestionsLabel={t('practice.subjectSuggestions')}
              subjectSuggestions={PRACTICE_SUBJECT_SUGGESTIONS}
              topicSuggestionsLabel={t('practice.topicSuggestions')}
              topicSuggestions={topicSuggestions}
              expanded={showForm}
              onToggle={() => setShowForm((value) => !value)}
              onSubjectChange={setSubject}
              onTopicChange={setTopic}
              onSubjectSuggestion={(value) => setSubject(normalizeTopic(value))}
              onTopicSuggestion={(value) => setTopic(normalizeTopic(value))}
              difficulties={TEST_DIFFICULTIES}
              difficultyLabels={difficultyLabels}
              selectedDifficulty={difficulty}
              onDifficultyChange={(value) => setDifficulty(value as (typeof TEST_DIFFICULTIES)[number])}
              counts={COUNTS}
              selectedCount={count}
              onCountChange={setCount}
              subjectLabel={t('practice.subject')}
              topicLabel={t('practice.topic')}
              difficultyLabel={t('practice.difficulty')}
              questionsLabel={t('practice.questions')}
              generateLabel={
                generateTest.isPending ? t('practice.generating') : t('practice.generateStart')
              }
              generating={generateTest.isPending}
              generateDisabled={!subject.trim() || !topic.trim() || !examTag}
              onGenerate={handleGenerate}
              aiOptionsTitle={t('practice.aiOptionsTitle')}
              aiOptionsFetchLabel={t('practice.aiOptionsFetch')}
              aiOptionsLoadingLabel={t('practice.aiOptionsLoading')}
              aiOptionsUseLabel={t('practice.aiOptionsUse')}
              aiOptionsEmptyHint={t('practice.aiOptionsEmpty')}
              aiSuggestions={practiceSuggestions.data?.suggestions ?? []}
              aiSuggestionsLoading={practiceSuggestions.isPending}
              onFetchAiSuggestions={fetchAiSuggestions}
              onApplyAiSuggestion={applyAiSuggestion}
              countLabelFor={(value) => t('practice.questionCount', { count: value })}
            />
          }
        />

        <View style={styles.body}>
          <PracticeGoalHub
            hasGoal={hasGoal}
            examName={examName || examTag}
            daysLeft={daysLeft}
            dreamMessage={examPlanQuery.data?.aiAdvice.dreamMessage}
            setGoalTitle={t('practice.setGoalTitle')}
            setGoalBody={t('practice.setGoalBody')}
            setGoalAction={t('practice.setGoalAction')}
            examPlanLabel={t('practice.openExamPlan')}
            askAiLabel={t('practice.askAiHelp')}
            gamesLabel={t('practice.openGames')}
            todayPlanLine={
              (examPlanQuery.data?.today.total ?? 0) > 0
                ? t('practice.todayPlan', {
                    completed: examPlanQuery.data?.today.completed ?? 0,
                    total: examPlanQuery.data?.today.total ?? 0,
                  })
                : undefined
            }
            onSetGoal={openProfile}
            onExamPlan={openExamPlan}
            onAskAi={openAskAi}
            onGames={openGames}
          />

          <PracticeFocusChips
            title={t('practice.focusTopics')}
            topics={focusTopics}
            onSelect={(value) => applyTopic(value)}
          />

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

          <PracticeStatsRow
            stats={[
              {
                value: String(attemptsQuery.data?.pagination?.total ?? attempts.length),
                label: t('practice.testsTaken'),
                tone: 'indigo',
              },
              {
                value: `${avgScore}%`,
                label: t('practice.avgScore'),
                tone: 'green',
              },
              {
                value: `${streakCount}d`,
                label: t('practice.streakStat'),
                tone: 'amber',
              },
            ]}
          />
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
