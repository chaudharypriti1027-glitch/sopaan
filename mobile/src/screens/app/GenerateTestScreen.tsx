import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BarChart3, Sparkles, Target, TrendingUp } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Button, Card, FeatureScreenLayout, TextField } from '../../components';
import { Text } from '../../components/Text';
import { PracticeAiOptionList, PRACTICE_UI } from '../../components/practice';
import type { PracticeTestMode } from '../../components/practice';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import {
  useExamPlan,
  useGenerateTest,
  usePracticeSuggestions,
  useProfile,
  useProGate,
  useReadiness,
} from '../../hooks';
import {
  estimatePracticeDurationMin,
  PRACTICE_QUESTION_COUNTS,
  PRACTICE_SUBJECT_SUGGESTIONS,
} from '../../content/practiceGeneratorContent';
import { TEST_DIFFICULTIES } from '../../content/testBuilderContent';
import type { PracticeSuggestion } from '../../api/ai';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'GenerateTest'>;
type Route = RouteProp<MainStackParamList, 'GenerateTest'>;

function normalizeTopic(value: string) {
  return value
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Navy-filled selection pill — premium selected state. */
function SelectPill({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        pillStyles.pill,
        selected && pillStyles.pillSelected,
        pressed && pillStyles.pressed,
      ]}
    >
      <Text style={[pillStyles.label, selected && pillStyles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(28,36,80,0.14)',
  },
  pillSelected: {
    backgroundColor: PRACTICE_UI.navy,
    borderColor: PRACTICE_UI.navy,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: PRACTICE_UI.ink,
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

/** Side-by-side mode option cards with icon + description. */
function ModeOption({
  Icon,
  title,
  description,
  selected,
  onPress,
  testID,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        modeStyles.card,
        selected && modeStyles.cardSelected,
        pressed && modeStyles.pressed,
      ]}
    >
      <View style={[modeStyles.icon, selected && modeStyles.iconSelected]}>
        <Icon
          size={16}
          color={selected ? PRACTICE_UI.goldCtaText : PRACTICE_UI.navy}
          strokeWidth={2.2}
        />
      </View>
      <Text style={[modeStyles.title, selected && modeStyles.titleSelected]}>{title}</Text>
      <Text style={modeStyles.desc} numberOfLines={3}>
        {description}
      </Text>
    </Pressable>
  );
}

const modeStyles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 6,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(28,36,80,0.1)',
  },
  cardSelected: {
    borderColor: PRACTICE_UI.goldBadge,
    backgroundColor: '#FDFAF2',
  },
  pressed: {
    opacity: 0.92,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRACTICE_UI.statIndigoBg,
  },
  iconSelected: {
    backgroundColor: PRACTICE_UI.gold,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PRACTICE_UI.ink,
  },
  titleSelected: {
    color: PRACTICE_UI.goldDeep,
  },
  desc: {
    fontSize: 11,
    lineHeight: 15,
    color: PRACTICE_UI.meta,
  },
});

/** Gold uppercase section label with dot accent. */
function SectionLabel({ label, trailing }: { label: string; trailing?: string }) {
  return (
    <View style={labelStyles.row}>
      <View style={labelStyles.left}>
        <View style={labelStyles.dot} />
        <Text style={labelStyles.text}>{label}</Text>
      </View>
      {trailing ? <Text style={labelStyles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

const labelStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    backgroundColor: PRACTICE_UI.goldBadge,
    transform: [{ rotate: '45deg' }],
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PRACTICE_UI.sectionLabel,
  },
  trailing: {
    fontSize: 11,
    fontWeight: '700',
    color: PRACTICE_UI.statGreen,
  },
});

function SuggestionChips({
  items,
  onSelect,
}: {
  items: readonly string[];
  onSelect: (value: string) => void;
}) {
  if (!items.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={chipStyles.row}
    >
      {items.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          onPress={() => onSelect(item)}
          style={({ pressed }) => [chipStyles.chip, pressed && chipStyles.pressed]}
        >
          <Text style={chipStyles.text} numberOfLines={1}>
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const chipStyles = StyleSheet.create({
  row: { gap: 8, paddingRight: 4 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: PRACTICE_UI.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.28)',
    maxWidth: 220,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: PRACTICE_UI.goldDeep,
  },
});

/** Dedicated AI test generator — premium sectioned form. */
export function GenerateTestScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: profile } = useProfile();
  const examTag = profile?.profile.goal?.examTrack;
  const hasGoal = Boolean(examTag);
  const examPlanQuery = useExamPlan(hasGoal);
  const readinessQuery = useReadiness(hasGoal);
  const generateTest = useGenerateTest();
  const practiceSuggestions = usePracticeSuggestions();
  const { handleProError, guardFeature } = useProGate();

  const [subject, setSubject] = useState(() =>
    route.params?.subject ? normalizeTopic(route.params.subject) : '',
  );
  const [topic, setTopic] = useState(() =>
    route.params?.topic ? normalizeTopic(route.params.topic) : '',
  );
  const [difficulty, setDifficulty] = useState<(typeof TEST_DIFFICULTIES)[number]>('medium');
  const [count, setCount] = useState(10);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [testMode, setTestMode] = useState<PracticeTestMode>('standard');

  const isAdaptive = testMode === 'adaptive';

  const focusTopics = useMemo(() => {
    const fromToday =
      examPlanQuery.data?.today.sessions
        ?.map((session) => session.topic?.trim())
        .filter((value): value is string => Boolean(value)) ?? [];
    const fromReadiness = readinessQuery.data?.focusNext ?? [];
    const fromPlan = examPlanQuery.data?.aiAdvice.focusAreas ?? [];
    return [...new Set([...fromToday, ...fromReadiness, ...fromPlan])].slice(0, 8);
  }, [examPlanQuery.data, readinessQuery.data]);

  const topicSuggestions = useMemo(
    () => focusTopics.filter((item) => item !== topic.trim()),
    [focusTopics, topic],
  );

  const difficultyLabel = (level: (typeof TEST_DIFFICULTIES)[number]) => {
    if (level === 'easy') return t('practice.difficultyEasy');
    if (level === 'hard') return t('practice.difficultyHard');
    return t('practice.difficultyMedium');
  };

  const difficultyLabels = useMemo(
    () =>
      Object.fromEntries(
        TEST_DIFFICULTIES.map((level) => [level, difficultyLabel(level)]),
      ) as Record<string, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const handleGenerate = () => {
    const trimmedSubject = subject.trim();
    const trimmedTopic = topic.trim();

    if (!trimmedSubject || !trimmedTopic) {
      Alert.alert(t('practice.generateFailed'), t('practice.fillRequired'));
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
            ...(isAdaptive ? { adaptive: true } : { difficulty }),
            count,
            examTag,
            language,
          });
          navigation.replace('TestReady', {
            testId: test.id,
            subject: trimmedSubject,
            topic: trimmedTopic,
            difficulty: isAdaptive ? 'medium' : difficulty,
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
  };

  const durationHint = t('practice.estimatedDuration', {
    count: estimatePracticeDurationMin(count),
  });

  return (
    <FeatureScreenLayout title={t('practice.aiPrompt')} eyebrow={t('practice.aiBadge')}>
      {examTag ? (
        <View style={styles.examRow}>
          <View style={styles.examIcon}>
            <Target size={15} color={PRACTICE_UI.goldDeep} strokeWidth={2.3} />
          </View>
          <View style={styles.examCopy}>
            <Text style={styles.examLabel}>{t('practice.examTagLabel')}</Text>
            <Text style={styles.examValue}>{examTag}</Text>
          </View>
          <Sparkles size={15} color={PRACTICE_UI.goldBadge} strokeWidth={2.2} />
        </View>
      ) : null}

      <Card style={styles.section} padded>
        <SectionLabel label={t('practice.subject')} />
        <TextField
          value={subject}
          onChangeText={setSubject}
          placeholder={t('practice.subjectPlaceholder')}
          testID="generate-subject"
        />
        <SuggestionChips
          items={PRACTICE_SUBJECT_SUGGESTIONS}
          onSelect={(value) => setSubject(normalizeTopic(value))}
        />

        <View style={styles.fieldGap} />

        <SectionLabel label={t('practice.topic')} />
        <TextField
          value={topic}
          onChangeText={setTopic}
          placeholder={t('practice.topicPlaceholder')}
          testID="generate-topic"
        />
        <SuggestionChips
          items={topicSuggestions}
          onSelect={(value) => setTopic(normalizeTopic(value))}
        />
      </Card>

      <Card style={styles.section} padded>
        <SectionLabel label={t('practice.modeLabel')} />
        <View style={styles.modeRow}>
          <ModeOption
            Icon={BarChart3}
            title={t('practice.modeStandard')}
            description={t('practice.modeStandardHint')}
            selected={testMode === 'standard'}
            onPress={() => setTestMode('standard')}
            testID="practice-mode-standard"
          />
          <ModeOption
            Icon={TrendingUp}
            title={t('practice.modeAdaptive')}
            description={t('practice.modeAdaptiveHint')}
            selected={testMode === 'adaptive'}
            onPress={() => setTestMode('adaptive')}
            testID="practice-mode-adaptive"
          />
        </View>

        {!isAdaptive ? (
          <>
            <View style={styles.fieldGap} />
            <SectionLabel label={t('practice.difficulty')} />
            <View style={styles.pillRow}>
              {TEST_DIFFICULTIES.map((level) => (
                <SelectPill
                  key={level}
                  label={difficultyLabels[level] ?? level}
                  selected={difficulty === level}
                  onPress={() => setDifficulty(level)}
                />
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.fieldGap} />
        <SectionLabel label={t('practice.questions')} trailing={durationHint} />
        <View style={styles.pillRow}>
          {PRACTICE_QUESTION_COUNTS.map((n) => (
            <SelectPill
              key={n}
              label={String(n)}
              selected={count === n}
              onPress={() => setCount(n)}
            />
          ))}
        </View>

        <View style={styles.fieldGap} />
        <SectionLabel label={t('practice.languageLabel')} />
        <View style={styles.pillRow}>
          <SelectPill
            label={t('practice.languageEn')}
            selected={language === 'en'}
            onPress={() => setLanguage('en')}
          />
          <SelectPill
            label={t('practice.languageHi')}
            selected={language === 'hi'}
            onPress={() => setLanguage('hi')}
          />
        </View>
      </Card>

      <Card style={styles.section} padded>
        <PracticeAiOptionList
          title={t('practice.aiOptionsTitle')}
          fetchLabel={t('practice.aiOptionsFetch')}
          loadingLabel={t('practice.aiOptionsLoading')}
          useLabel={t('practice.aiOptionsUse')}
          emptyHint={t('practice.aiOptionsEmpty')}
          difficultyLabels={difficultyLabels}
          modeStandardLabel={t('practice.modeStandard')}
          modeAdaptiveLabel={t('practice.modeAdaptive')}
          countLabel={(value) => t('practice.questionCount', { count: value })}
          suggestions={practiceSuggestions.data?.suggestions ?? []}
          loading={practiceSuggestions.isPending}
          onFetch={fetchAiSuggestions}
          onSelect={applyAiSuggestion}
        />
      </Card>

      <Button
        label={generateTest.isPending ? t('practice.generating') : t('practice.generateStart')}
        testID="practice-generate-start"
        fullWidth
        variant="gold"
        loading={generateTest.isPending}
        disabled={!subject.trim() || !topic.trim() || !examTag}
        onPress={handleGenerate}
      />
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    examRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: PRACTICE_UI.statAmberBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(201,162,75,0.3)',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    examIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(201,162,75,0.18)',
    },
    examCopy: {
      flex: 1,
      minWidth: 0,
    },
    examLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: PRACTICE_UI.goldDeep,
    },
    examValue: {
      fontSize: 14,
      fontWeight: '800',
      color: PRACTICE_UI.ink,
      marginTop: 1,
    },
    section: {
      gap: 10,
      borderWidth: 1,
      borderColor: 'rgba(201,162,75,0.16)',
    },
    fieldGap: {
      height: 4,
    },
    modeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
