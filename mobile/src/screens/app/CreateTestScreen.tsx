import { useNavigation } from '@react-navigation/native';
import { Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AIBadge,
  AIGoldCard,
  Button,
  ChipSelect,
  FeatureScreenLayout,
  PremiumFeatureCard,
  QuizOption,
  SectionTitle,
  TextField,
} from '../../components';
import { aiApi, testsApi, type CommunityQuestionInput } from '../../api';
import { DEFAULT_EXAM_TAG } from '../../content/featureDefaultsContent';
import {
  CREATE_TEST_AI_QUESTION_COUNT,
  DIFFICULTY_LABEL_KEYS,
  QUIZ_OPTION_KEYS,
  TEST_DIFFICULTIES,
  type TestDifficulty,
} from '../../content/testBuilderContent';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useCreateCommunityTest, useProfile } from '../../hooks';
import { useTheme } from '../../theme';

type DraftQuestion = CommunityQuestionInput & { localId: string };

function emptyQuestion(subject: string, topic: string, difficulty: DraftQuestion['difficulty']): DraftQuestion {
  return {
    localId: `q_${Date.now()}_${Math.random()}`,
    text: '',
    subject,
    topic,
    difficulty,
    options: QUIZ_OPTION_KEYS.map((key) => ({ key, text: '' })),
    correctKey: 'A',
  };
}

export function CreateTestScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const createTest = useCreateCommunityTest();

  const examTag = profileQuery.data?.profile.goal?.examTrack ?? DEFAULT_EXAM_TAG;

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<TestDifficulty>('medium');
  const [durationMin, setDurationMin] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const difficultyLabel = (level: TestDifficulty) => t(DIFFICULTY_LABEL_KEYS[level]);

  const updateQuestion = (localId: string, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)));
  };

  const updateOption = (localId: string, key: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === localId
          ? {
              ...q,
              options: q.options.map((opt) => (opt.key === key ? { ...opt, text } : opt)),
            }
          : q,
      ),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(subject.trim(), topic.trim(), difficulty)]);
  };

  const autoGenerate = async () => {
    const trimmedSubject = subject.trim();
    const trimmedTopic = topic.trim();

    if (!trimmedSubject || !trimmedTopic) {
      Alert.alert(t('createTest.subjectTopicRequired'), t('createTest.subjectTopicRequiredBody'));
      return;
    }

    setAiLoading(true);
    try {
      const generated = await aiApi.generateTest({
        subject: trimmedSubject,
        topic: trimmedTopic,
        difficulty,
        count: CREATE_TEST_AI_QUESTION_COUNT,
        examTag,
      });
      const detail = await testsApi.getTest(generated.id);
      const imported: DraftQuestion[] = (detail.questions ?? []).map((q) => ({
        localId: `q_${q.id}`,
        text: q.text,
        subject: q.subject ?? subject,
        topic: q.topic ?? topic,
        difficulty: (q.difficulty as DraftQuestion['difficulty']) ?? difficulty,
        options: q.options?.length === 4 ? q.options : QUIZ_OPTION_KEYS.map((key) => ({ key, text: '' })),
        correctKey: q.correctKey ?? 'A',
        explanation: q.explanation,
      }));
      if (imported.length) {
        setQuestions(imported);
        if (!title.trim()) setTitle(generated.title);
      }
    } catch (error) {
      Alert.alert(t('createTest.aiFailed'), getUserFacingMessage(error) || t('createTest.aiFailedBody'));
    } finally {
      setAiLoading(false);
    }
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      Alert.alert(t('createTest.titleRequired'), t('createTest.titleRequiredBody'));
      return false;
    }

    if (!subject.trim() || !topic.trim()) {
      Alert.alert(
        t('createTest.subjectTopicRequired'),
        t('createTest.subjectTopicRequiredSaveBody'),
      );
      return false;
    }

    if (!questions.length) {
      Alert.alert(t('createTest.noQuestions'), t('createTest.noQuestionsBody'));
      return false;
    }

    const duration = Number(durationMin);
    if (!durationMin.trim() || !Number.isFinite(duration) || duration <= 0) {
      Alert.alert(t('createTest.durationRequired'), t('createTest.durationRequiredBody'));
      return false;
    }

    for (const [index, q] of questions.entries()) {
      if (!q.text.trim()) {
        Alert.alert(
          t('createTest.incompleteQuestion'),
          t('createTest.incompleteQuestionBody', { n: index + 1 }),
        );
        return false;
      }
      if (q.options.some((opt) => !opt.text.trim())) {
        Alert.alert(
          t('createTest.incompleteOptions'),
          t('createTest.incompleteOptionsBody', { n: index + 1 }),
        );
        return false;
      }
    }

    return true;
  };

  const save = async (status: 'draft' | 'published') => {
    if (!validate()) return;

    try {
      await createTest.mutateAsync({
        title: title.trim(),
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        durationSec: Math.max(60, Number(durationMin) * 60),
        examTag,
        status,
        questions: questions.map(({ localId: _localId, ...q }) => q),
      });
      Alert.alert(
        status === 'published' ? t('createTest.published') : t('createTest.draftSaved'),
        t('createTest.savedBody'),
      );
      navigation.goBack();
    } catch {
      Alert.alert(t('createTest.saveFailed'), t('createTest.saveFailedBody'));
    }
  };

  return (
    <FeatureScreenLayout title={t('createTest.title')} subtitle={t('createTest.subtitle')}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        <PremiumFeatureCard style={styles.form}>
          <TextField label={t('forum.titleLabel')} value={title} onChangeText={setTitle} />
          <TextField label={t('practice.subject')} value={subject} onChangeText={setSubject} />
          <TextField label={t('practice.topic')} value={topic} onChangeText={setTopic} />
          <TextField
            label={t('createTest.duration')}
            value={durationMin}
            onChangeText={setDurationMin}
            keyboardType="number-pad"
          />

          <View style={styles.diffRow}>
            {TEST_DIFFICULTIES.map((level) => (
              <ChipSelect
                key={level}
                label={difficultyLabel(level)}
                selected={difficulty === level}
                onPress={() => setDifficulty(level)}
              />
            ))}
          </View>
        </PremiumFeatureCard>

        <AIGoldCard style={styles.aiCard}>
          <View style={styles.aiRow}>
            <AIBadge label={t('createTest.aiBadge')} />
            <Text style={styles.aiHint}>
              {t('createTest.aiHint', { count: CREATE_TEST_AI_QUESTION_COUNT })}
            </Text>
          </View>
          <Button
            label={aiLoading ? t('createTest.generating') : t('createTest.autoGenerate')}
            variant="gold"
            icon={<Sparkles size={16} color={theme.colors.text.inverse} />}
            onPress={autoGenerate}
            disabled={aiLoading}
            fullWidth
          />
        </AIGoldCard>

        <SectionTitle title={t('createTest.questions')} />
        {questions.map((question, index) => (
          <PremiumFeatureCard key={question.localId} style={styles.questionCard}>
            <Text style={styles.qLabel}>{t('createTest.questionN', { n: index + 1 })}</Text>
            <TextField
              label={t('createTest.questionText')}
              value={question.text}
              onChangeText={(text) => updateQuestion(question.localId, { text })}
              multiline
            />
            {QUIZ_OPTION_KEYS.map((key) => (
              <View key={key} style={styles.optionRow}>
                <Pressable onPress={() => updateQuestion(question.localId, { correctKey: key })}>
                  <QuizOption
                    indexLabel={key}
                    label={question.options.find((o) => o.key === key)?.text ?? ''}
                    state={question.correctKey === key ? 'correct' : 'default'}
                    disabled
                  />
                </Pressable>
                <TextField
                  placeholder={t('createTest.optionPlaceholder', { key })}
                  value={question.options.find((o) => o.key === key)?.text ?? ''}
                  onChangeText={(text) => updateOption(question.localId, key, text)}
                />
              </View>
            ))}
            <Text style={styles.correctHint}>
              {t('createTest.correctHint', { key: question.correctKey })}
            </Text>
          </PremiumFeatureCard>
        ))}

        <Button label={t('createTest.addQuestion')} variant="ghost" onPress={addQuestion} />

        <View style={styles.actions}>
          <Button
            label={createTest.isPending ? t('createTest.saving') : t('createTest.saveDraft')}
            variant="ghost"
            onPress={() => save('draft')}
            disabled={createTest.isPending}
          />
          <Button
            label={t('createTest.publish')}
            onPress={() => save('published')}
            disabled={createTest.isPending}
          />
        </View>
      </ScrollView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scrollBody: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    form: { gap: theme.spacing.md, padding: theme.spacing.md },
    diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    aiCard: { gap: theme.spacing.md },
    aiRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    aiHint: { ...theme.typography.presets.caption, color: theme.colors.text.secondary, flex: 1 },
    questionCard: { gap: theme.spacing.md, padding: theme.spacing.md },
    qLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
    },
    optionRow: { gap: theme.spacing.xs },
    correctHint: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    actions: { gap: theme.spacing.sm },
  });
}
