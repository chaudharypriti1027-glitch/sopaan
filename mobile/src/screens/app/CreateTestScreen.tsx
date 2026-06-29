import { useNavigation } from '@react-navigation/native';
import { Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AIBadge,
  Button,
  Card,
  ChipSelect,
  QuizOption,
  Screen,
  SectionTitle,
  TextField,
} from '../../components';
import { aiApi, testsApi, type CommunityQuestionInput } from '../../api';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useCreateCommunityTest, useProfile } from '../../hooks';
import { useTheme } from '../../theme';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

type DraftQuestion = CommunityQuestionInput & { localId: string };

function emptyQuestion(subject: string, topic: string, difficulty: DraftQuestion['difficulty']): DraftQuestion {
  return {
    localId: `q_${Date.now()}_${Math.random()}`,
    text: '',
    subject,
    topic,
    difficulty,
    options: OPTION_KEYS.map((key) => ({ key, text: '' })),
    correctKey: 'A',
  };
}

export function CreateTestScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const createTest = useCreateCommunityTest();

  const examTag = profileQuery.data?.profile.goal?.examTrack ?? 'SSC-CGL';

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [topic, setTopic] = useState('Mixed');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('medium');
  const [durationMin, setDurationMin] = useState('30');
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion('General', 'Mixed', 'medium')]);
  const [aiLoading, setAiLoading] = useState(false);

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
    setQuestions((prev) => [...prev, emptyQuestion(subject, topic, difficulty)]);
  };

  const autoGenerate = async () => {
    setAiLoading(true);
    try {
      const generated = await aiApi.generateTest({
        subject,
        topic,
        difficulty,
        count: 5,
        examTag,
      });
      const detail = await testsApi.getTest(generated.id);
      const imported: DraftQuestion[] = (detail.questions ?? []).map((q) => ({
        localId: `q_${q.id}`,
        text: q.text,
        subject: q.subject ?? subject,
        topic: q.topic ?? topic,
        difficulty: (q.difficulty as DraftQuestion['difficulty']) ?? difficulty,
        options: q.options?.length === 4 ? q.options : OPTION_KEYS.map((key) => ({ key, text: '' })),
        correctKey: q.correctKey ?? 'A',
        explanation: q.explanation,
      }));
      if (imported.length) {
        setQuestions(imported);
        if (!title.trim()) setTitle(generated.title);
      }
    } catch (error) {
      Alert.alert('AI generation failed', getUserFacingMessage(error));
    } finally {
      setAiLoading(false);
    }
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a test title.');
      return false;
    }

    for (const [index, q] of questions.entries()) {
      if (!q.text.trim()) {
        Alert.alert('Incomplete question', `Question ${index + 1} needs text.`);
        return false;
      }
      if (q.options.some((opt) => !opt.text.trim())) {
        Alert.alert('Incomplete options', `Fill all options for question ${index + 1}.`);
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
      Alert.alert(status === 'published' ? 'Published' : 'Draft saved', 'Your community test was saved.');
      navigation.goBack();
    } catch {
      Alert.alert('Save failed', 'Could not save the test. Check your questions and try again.');
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionTitle title="Create test" subtitle="Build and share with the community" />

        <Card style={styles.form}>
          <TextField label="Title" value={title} onChangeText={setTitle} />
          <TextField label="Subject" value={subject} onChangeText={setSubject} />
          <TextField label="Topic" value={topic} onChangeText={setTopic} />
          <TextField
            label="Duration (minutes)"
            value={durationMin}
            onChangeText={setDurationMin}
            keyboardType="number-pad"
          />

          <View style={styles.diffRow}>
            {DIFFICULTIES.map((level) => (
              <ChipSelect
                key={level}
                label={level}
                selected={difficulty === level}
                onPress={() => setDifficulty(level)}
              />
            ))}
          </View>

          <View style={styles.aiRow}>
            <AIBadge label="AI" />
            <Button
              label={aiLoading ? 'Generating…' : 'Auto-generate with AI'}
              variant="ghost"
              icon={<Sparkles size={16} color={theme.colors.brand.primary} />}
              onPress={autoGenerate}
              disabled={aiLoading}
            />
          </View>
        </Card>

        <SectionTitle title="Questions" />
        {questions.map((question, index) => (
          <Card key={question.localId} style={styles.questionCard}>
            <Text style={styles.qLabel}>Question {index + 1}</Text>
            <TextField
              label="Question text"
              value={question.text}
              onChangeText={(text) => updateQuestion(question.localId, { text })}
              multiline
            />
            {OPTION_KEYS.map((key) => (
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
                  placeholder={`Option ${key}`}
                  value={question.options.find((o) => o.key === key)?.text ?? ''}
                  onChangeText={(text) => updateOption(question.localId, key, text)}
                />
              </View>
            ))}
            <Text style={styles.correctHint}>
              Tap an option above to mark correct (selected: {question.correctKey})
            </Text>
          </Card>
        ))}

        <Button label="Add question" variant="ghost" onPress={addQuestion} />

        <View style={styles.actions}>
          <Button
            label={createTest.isPending ? 'Saving…' : 'Save draft'}
            variant="ghost"
            onPress={() => save('draft')}
            disabled={createTest.isPending}
          />
          <Button
            label="Publish"
            onPress={() => save('published')}
            disabled={createTest.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    form: { gap: theme.spacing.md },
    diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    aiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    questionCard: { gap: theme.spacing.md },
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
