import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, CheckCircle2, Image as ImageIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AIBadge,
  Button,
  Card,
  ProgressBar,
  Screen,
  SectionTitle,
  TextField,
} from '../../components';
import { useEvaluateAnswer, useReportAiFeedback } from '../../hooks/useAi';
import { useProGate } from '../../hooks/useProGate';
import type { MainStackParamList } from '../../navigation/types';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';
import { pickImageBase64 } from '../../utils/imagePicker';

const MAX_MARKS = 15;

export function AnswerEvaluationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { t } = useTranslation(['app', 'common']);
  const { formatNumber } = useFormat();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [question, setQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const evaluateMutation = useEvaluateAnswer();
  const reportMutation = useReportAiFeedback();
  const { handleProError } = useProGate();

  const handleScan = async (source: 'camera' | 'library') => {
    const base64 = await pickImageBase64(source);
    if (!base64) {
      return;
    }
    setImageBase64(base64);
    setImagePreview(`data:image/jpeg;base64,${base64}`);
  };

  const handleEvaluate = async () => {
    if (!question.trim()) {
      Alert.alert(t('answerEvaluation.questionRequiredTitle'), t('answerEvaluation.questionRequiredBody'));
      return;
    }
    if (!answerText.trim() && !imageBase64) {
      Alert.alert(t('answerEvaluation.answerRequiredTitle'), t('answerEvaluation.answerRequiredBody'));
      return;
    }

    try {
      await evaluateMutation.mutateAsync({
        question: question.trim(),
        answerText: answerText.trim() || undefined,
        imageBase64: imageBase64 ?? undefined,
        maxMarks: MAX_MARKS,
      });
    } catch (error) {
      if (handleProError(error)) {
        return;
      }
      Alert.alert(t('answerEvaluation.evaluationFailed'), getUserFacingMessage(error));
    }
  };

  const result = evaluateMutation.data;

  const handleReport = () => {
    if (!result) {
      return;
    }

    Alert.alert(t('answerEvaluation.reportTitle'), t('answerEvaluation.reportBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('app:askAi.reportInaccurate'),
        onPress: async () => {
          try {
            await reportMutation.mutateAsync({
              feature: 'answer_evaluation',
              reason: 'inaccurate',
              inputSummary: question.slice(0, 500),
              outputSnapshot: result,
            });
            Alert.alert(t('app:askAi.reportedTitle'), t('app:answerEvaluation.reportedEvaluation'));
          } catch {
            Alert.alert(t('app:askAi.reportFailedTitle'), t('app:askAi.reportFailedBody'));
          }
        },
      },
      {
        text: t('app:askAi.reportOffTopic'),
        onPress: async () => {
          try {
            await reportMutation.mutateAsync({
              feature: 'answer_evaluation',
              reason: 'off_topic',
              inputSummary: question.slice(0, 500),
              outputSnapshot: result,
            });
            Alert.alert(t('app:askAi.reportedTitle'), t('app:answerEvaluation.reportedEvaluation'));
          } catch {
            Alert.alert(t('app:askAi.reportFailedTitle'), t('app:askAi.reportFailedBody'));
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={styles.back}>{t('app:askAi.back')}</Text>
      </Pressable>

      <View style={styles.header}>
        <SectionTitle
          title={t('answerEvaluation.title')}
          subtitle={t('answerEvaluation.subtitle')}
        />
        <AIBadge label={t('answerEvaluation.mainsBadge')} />
      </View>

      <Card style={styles.form}>
        <TextField
          label={t('answerEvaluation.question')}
          placeholder={t('answerEvaluation.questionPlaceholder')}
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <TextField
          label={t('answerEvaluation.yourAnswer')}
          placeholder={t('answerEvaluation.answerPlaceholder')}
          value={answerText}
          onChangeText={setAnswerText}
          multiline
          style={styles.answerInput}
        />

        <View style={styles.scanRow}>
          <Button
            label={t('answerEvaluation.scanAnswer')}
            variant="ghost"
            size="sm"
            icon={<Camera size={16} color={theme.colors.text.secondary} />}
            onPress={() => handleScan('camera')}
          />
          <Button
            label={t('answerEvaluation.fromGallery')}
            variant="ghost"
            size="sm"
            icon={<ImageIcon size={16} color={theme.colors.text.secondary} />}
            onPress={() => handleScan('library')}
          />
        </View>

        {imagePreview ? (
          <View style={styles.previewBlock}>
            <Image source={{ uri: imagePreview }} style={styles.previewImage} />
            <Pressable onPress={() => { setImageBase64(null); setImagePreview(null); }}>
              <Text style={styles.removePreview}>{t('answerEvaluation.removeScan')}</Text>
            </Pressable>
          </View>
        ) : null}

        <Button
          label={evaluateMutation.isPending ? t('answerEvaluation.evaluating') : t('answerEvaluation.evaluateAnswer')}
          onPress={handleEvaluate}
          disabled={evaluateMutation.isPending}
        />
      </Card>

      {evaluateMutation.isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          <Text style={styles.loadingText}>{t('answerEvaluation.reviewing')}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={styles.results}>
          <Card style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>{t('answerEvaluation.totalScore')}</Text>
            <Text style={styles.scoreValue}>
              {formatNumber(result.score)}
              <Text style={styles.scoreMax}> / {formatNumber(MAX_MARKS)}</Text>
            </Text>
          </Card>

          <SectionTitle title={t('answerEvaluation.breakdown')} />
          <Card style={styles.breakdown}>
            <ProgressBar
              label={t('answerEvaluation.content')}
              value={result.subScores.content}
              max={MAX_MARKS}
              variant="primary"
              showValue
            />
            <ProgressBar
              label={t('answerEvaluation.structure')}
              value={result.subScores.structure}
              max={MAX_MARKS}
              variant="teal"
              showValue
            />
            <ProgressBar
              label={t('answerEvaluation.clarity')}
              value={result.subScores.clarity}
              max={MAX_MARKS}
              variant="gold"
              showValue
            />
          </Card>

          <SectionTitle title={t('answerEvaluation.whatToImprove')} />
          <Card style={styles.feedbackCard}>
            {result.feedback.map((item) => (
              <View key={item} style={styles.feedbackRow}>
                <CheckCircle2 size={16} color={theme.colors.semantic.warning} />
                <Text style={styles.feedbackText}>{item}</Text>
              </View>
            ))}
          </Card>

          <Button
            label={t('answerEvaluation.reportEvaluation')}
            variant="ghost"
            fullWidth
            onPress={handleReport}
            disabled={reportMutation.isPending}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing['3xl'],
    },
    back: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.brand.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    form: {
      gap: theme.spacing.md,
    },
    answerInput: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    scanRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    previewBlock: {
      gap: theme.spacing.sm,
    },
    previewImage: {
      width: '100%',
      height: 160,
      borderRadius: theme.radii.md,
    },
    removePreview: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
    },
    loading: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xl,
    },
    loadingText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    results: {
      gap: theme.spacing.md,
    },
    scoreCard: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    scoreLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
    },
    scoreValue: {
      ...theme.typography.presets.statLarge,
      fontSize: theme.typography.scale.fontSize['3xl'],
      color: theme.colors.brand.primary,
      marginTop: theme.spacing.xs,
    },
    scoreMax: {
      fontSize: theme.typography.scale.fontSize.xl,
      color: theme.colors.text.tertiary,
    },
    breakdown: {
      gap: theme.spacing.md,
    },
    feedbackCard: {
      gap: theme.spacing.md,
    },
    feedbackRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'flex-start',
    },
    feedbackText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      flex: 1,
    },
  });
}
