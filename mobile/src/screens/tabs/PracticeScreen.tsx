import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  PracticeEmptyState,
  PracticeHeader,
  PracticeSectionHeader,
  PracticeStatsRow,
  PracticeTabBar,
  PracticeTestList,
  PRACTICE_UI,
  avatarToneForIndex,
  type PracticeTab,
} from '../../components/practice';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import {
  useAttempts,
  useGenerateTest,
  useProfile,
  useProGate,
  useTests,
} from '../../hooks';
import type { AppTabParamList, MainStackParamList } from '../../navigation/types';
import type { TestSummary } from '../../api/types';
import { PREMIUM } from '../../components/premium';

type PracticeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Practice'>,
  NativeStackNavigationProp<MainStackParamList>
>;

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const COUNTS = [5, 10, 15, 20];

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
    meta: [subject, ...metaParts].join(' · '),
  };
}

export function PracticeScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<PracticeNav>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);
  const { data: profile } = useProfile();
  const attemptsQuery = useAttempts({ limit: 100 });

  const mockQuery = useTests({ type: 'mock', limit: 10 });
  const sectionalQuery = useTests({ type: 'sectional', limit: 10 });
  const pyqQuery = useTests({ type: 'pyq', limit: 10 });
  const generateTest = useGenerateTest();
  const { handleProError, guardFeature } = useProGate();

  const [activeTab, setActiveTab] = useState<PracticeTab>('sectional');
  const [subject, setSubject] = useState(() => t('practice.defaultSubject'));
  const [topic, setTopic] = useState(() => t('practice.defaultTopic'));
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('medium');
  const [count, setCount] = useState(10);
  const [showForm, setShowForm] = useState(false);

  const examTag = profile?.profile.goal?.examTrack ?? 'SSC CGL';

  const difficultyLabel = (level: (typeof DIFFICULTIES)[number]) => {
    if (level === 'easy') return t('practice.difficultyEasy');
    if (level === 'hard') return t('practice.difficultyHard');
    return t('practice.difficultyMedium');
  };

  const difficultyLabels = useMemo(
    () =>
      Object.fromEntries(DIFFICULTIES.map((level) => [level, difficultyLabel(level)])) as Record<
        string,
        string
      >,
    // `difficultyLabel` is a plain function recreated each render, but its
    // output only depends on `t`, which is already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const openQuiz = (testId: string) => {
    navigation.getParent()?.navigate('Quiz', { testId });
  };

  const handleGenerate = async () => {
    guardFeature('ai_generate_test', () => {
      void (async () => {
        try {
          const test = await generateTest.mutateAsync({
            subject: subject.trim(),
            topic: topic.trim(),
            difficulty,
            count,
            examTag,
          });
          openQuiz(test.id);
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
    ]);
  };

  const isRefreshing =
    sectionalQuery.isRefetching || mockQuery.isRefetching || pyqQuery.isRefetching;

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
          subtitle={t('practice.subtitle')}
          aiCard={
            <PracticeAiCard
              badgeLabel={t('practice.aiBadge').toUpperCase()}
              title={t('practice.aiPrompt')}
              subject={subject}
              topic={topic}
              difficulty={difficultyLabel(difficulty)}
              countLabel={t('practice.questionCount', { count })}
              tapConfigure={t('practice.tapConfigure')}
              expanded={showForm}
              onToggle={() => setShowForm((value) => !value)}
              onSubjectChange={setSubject}
              onTopicChange={setTopic}
              difficulties={DIFFICULTIES}
              difficultyLabels={difficultyLabels}
              selectedDifficulty={difficulty}
              onDifficultyChange={(value) => setDifficulty(value as (typeof DIFFICULTIES)[number])}
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
              onGenerate={handleGenerate}
            />
          }
        />

        <View style={styles.body}>
          <PracticeTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <PracticeSectionHeader label={sectionTitle} countLabel={activeTotal > 0 ? countLabel : undefined} />

          {activeQuery.isLoading ? (
            <ActivityIndicator color={PRACTICE_UI.startEnd} style={styles.loader} />
          ) : activeItems.length ? (
            <PracticeTestList
              tests={testRows}
              startLabel={t('practice.startBtn')}
              onStart={openQuiz}
            />
          ) : activeTab === 'mock' ? (
            <PracticeEmptyState
              title={t('practice.noMockTitle')}
              description={t('practice.noMockDesc')}
              actionLabel={t('practice.emptyGenerate')}
              onAction={() => setShowForm(true)}
            />
          ) : (
            <PracticeEmptyState
              title={t('practice.noTestsTitle')}
              description={t('practice.noTests')}
              actionLabel={t('practice.emptyGenerate')}
              onAction={() => setShowForm(true)}
            />
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
      paddingTop: 18,
      gap: 16,
    },
    loader: {
      marginVertical: 24,
    },
  });
}
