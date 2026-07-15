import {
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  LayoutList,
  Lightbulb,
  MessageSquareText,
  PenLine,
  Sparkles,
  Target,
  ThumbsUp,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
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
  AIGoldCard,
  Button,
  FeatureScreenLayout,
  Pill,
  PremiumFeatureCard,
  PremiumHeroCard,
  PremiumSectionLabel,
  ProgressBar,
  TextField,
} from '../../components';
import { PREMIUM } from '../../components/premium/premiumStyles';
import type { EvaluateAnswerResponse } from '../../api/ai';
import { useEvaluateAnswer, useReportAiFeedback } from '../../hooks/useAi';
import { useProGate } from '../../hooks/useProGate';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';
import { pickImageBase64 } from '../../utils/imagePicker';

const MAX_MARKS = 15;

type ScoreBand = 'excellent' | 'good' | 'fair' | 'needsWork';

function scoreBand(score: number, maxMarks: number): ScoreBand {
  const pct = maxMarks > 0 ? score / maxMarks : 0;
  if (pct >= 0.8) return 'excellent';
  if (pct >= 0.65) return 'good';
  if (pct >= 0.45) return 'fair';
  return 'needsWork';
}

function expandFeedbackItems(items: string[] | undefined): string[] {
  if (!items?.length) return [];
  return items
    .flatMap((item) => item.split(/\n+/))
    .map((item) => item.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(Boolean);
}

type FeedbackRowProps = {
  text: string;
  index?: number;
  icon: ReactNode;
  styles: ReturnType<typeof createStyles>;
};

function FeedbackRow({ text, index, icon, styles }: FeedbackRowProps) {
  return (
    <View style={styles.feedbackRow}>
      <View style={styles.feedbackIcon}>{icon}</View>
      <View style={styles.feedbackBody}>
        {typeof index === 'number' ? (
          <Text style={styles.feedbackIndex}>{index + 1}</Text>
        ) : null}
        <Text style={styles.feedbackText}>{text}</Text>
      </View>
    </View>
  );
}

export function AnswerEvaluationScreen() {
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
  const { handleProError, guardFeature, canUseFeature, isPro, openPaywall, tier } = useProGate();

  const remainingEvals = tier?.usage?.remaining?.aiEvaluations;
  const quotaExhausted = !isPro && !canUseFeature('ai_evaluate');

  const handleScan = async (source: 'camera' | 'library') => {
    const base64 = await pickImageBase64(source);
    if (!base64) {
      return;
    }
    setImageBase64(base64);
    setImagePreview(`data:image/jpeg;base64,${base64}`);
  };

  const handleEvaluate = () => {
    if (!question.trim()) {
      Alert.alert(t('answerEvaluation.questionRequiredTitle'), t('answerEvaluation.questionRequiredBody'));
      return;
    }
    if (!answerText.trim() && !imageBase64) {
      Alert.alert(t('answerEvaluation.answerRequiredTitle'), t('answerEvaluation.answerRequiredBody'));
      return;
    }

    guardFeature('ai_evaluate', () => {
      void (async () => {
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
      })();
    });
  };

  const handleNewEvaluation = () => {
    evaluateMutation.reset();
  };

  const result = evaluateMutation.data as EvaluateAnswerResponse | undefined;
  const maxMarks = result?.maxMarks ?? MAX_MARKS;
  const band = result ? scoreBand(result.score ?? 0, maxMarks) : null;
  const subScores = {
    content: result?.subScores?.content ?? 0,
    structure: result?.subScores?.structure ?? 0,
    clarity: result?.subScores?.clarity ?? 0,
  };
  const strengths = expandFeedbackItems(result?.strengths);
  const improvements = expandFeedbackItems(result?.feedback);
  const nextSteps = expandFeedbackItems(result?.nextSteps);

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

  if (quotaExhausted && !result && !evaluateMutation.isPending) {
    return (
      <FeatureScreenLayout
        title={t('answerEvaluation.title')}
        subtitle={t('answerEvaluation.subtitle')}
        rightAction={<AIBadge label={t('answerEvaluation.mainsBadge')} />}
        contentStyle={styles.content}
      >
        <PremiumFeatureCard style={styles.lockedCard}>
          <PenLine size={32} color={theme.colors.brand.primary} strokeWidth={1.8} />
          <Text style={styles.lockedTitle}>{t('answerEvaluation.quotaTitle')}</Text>
          <Text style={styles.lockedBody}>{t('answerEvaluation.quotaBody')}</Text>
          <Button
            label={t('manageSubscription.upgradeToPro')}
            variant="gold"
            fullWidth
            onPress={() => openPaywall({ feature: 'ai_evaluate' })}
            accessibilityHint={t('manageSubscription.upgradeA11yHint')}
          />
        </PremiumFeatureCard>
      </FeatureScreenLayout>
    );
  }

  return (
    <FeatureScreenLayout
      title={t('answerEvaluation.title')}
      subtitle={t('answerEvaluation.subtitle')}
      rightAction={<AIBadge label={t('answerEvaluation.mainsBadge')} />}
      contentStyle={styles.content}
    >
      {!result && !evaluateMutation.isPending ? (
        <PremiumFeatureCard style={styles.form}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderText}>
              <Text style={styles.formEyebrow}>{t('answerEvaluation.formEyebrow')}</Text>
              <Text style={styles.formHint}>{t('answerEvaluation.formHint')}</Text>
            </View>
            {isPro ? (
              <Pill label={t('answerEvaluation.unlimited')} variant="gold" />
            ) : typeof remainingEvals === 'number' ? (
              <Pill
                label={t('answerEvaluation.remainingToday', { count: remainingEvals })}
                variant="primary"
              />
            ) : null}
          </View>

          <TextField
            label={t('answerEvaluation.question')}
            placeholder={t('answerEvaluation.questionPlaceholder')}
            value={question}
            onChangeText={setQuestion}
            multiline
            style={styles.questionInput}
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
            <Pressable
              style={styles.scanChip}
              onPress={() => handleScan('camera')}
              accessibilityRole="button"
              accessibilityLabel={t('answerEvaluation.scanAnswer')}
            >
              <Camera size={16} color={PREMIUM.ink} strokeWidth={1.8} />
              <Text style={styles.scanChipText}>{t('answerEvaluation.scanAnswer')}</Text>
            </Pressable>
            <Pressable
              style={styles.scanChip}
              onPress={() => handleScan('library')}
              accessibilityRole="button"
              accessibilityLabel={t('answerEvaluation.fromGallery')}
            >
              <ImageIcon size={16} color={PREMIUM.ink} strokeWidth={1.8} />
              <Text style={styles.scanChipText}>{t('answerEvaluation.fromGallery')}</Text>
            </Pressable>
          </View>

          {imagePreview ? (
            <View style={styles.previewBlock}>
              <Image source={{ uri: imagePreview }} style={styles.previewImage} />
              <Pressable
                onPress={() => {
                  setImageBase64(null);
                  setImagePreview(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('answerEvaluation.removeScan')}
              >
                <Text style={styles.removePreview}>{t('answerEvaluation.removeScan')}</Text>
              </Pressable>
            </View>
          ) : null}

          <Button
            label={t('answerEvaluation.evaluateAnswer')}
            variant="gold"
            fullWidth
            icon={<Sparkles size={16} color="#FFFFFF" strokeWidth={1.8} />}
            onPress={handleEvaluate}
          />
        </PremiumFeatureCard>
      ) : null}

      {evaluateMutation.isPending ? (
        <AIGoldCard style={styles.loadingCard}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          <Text style={styles.loadingTitle}>{t('answerEvaluation.reviewing')}</Text>
          <Text style={styles.loadingHint}>{t('answerEvaluation.reviewingHint')}</Text>
        </AIGoldCard>
      ) : null}

      {result && !evaluateMutation.isPending ? (
        <View style={styles.results}>
          <PremiumHeroCard
            icon={<Award size={24} color="#FFFFFF" strokeWidth={1.8} />}
            eyebrow={t('answerEvaluation.totalScore')}
            title={`${formatNumber(result.score ?? 0)} / ${formatNumber(maxMarks)}`}
            stats={[
              { label: t('answerEvaluation.content'), value: `${formatNumber(subScores.content)}` },
              { label: t('answerEvaluation.structure'), value: `${formatNumber(subScores.structure)}` },
              { label: t('answerEvaluation.clarity'), value: `${formatNumber(subScores.clarity)}` },
            ]}
          >
            {band ? (
              <View style={styles.bandPill}>
                <Text style={styles.bandText}>{t(`answerEvaluation.band.${band}`)}</Text>
              </View>
            ) : null}
          </PremiumHeroCard>

          <View style={styles.sectionHeader}>
            <PremiumSectionLabel title={t('answerEvaluation.breakdown')} compact />
            <LayoutList size={16} color={PREMIUM.sectionLabel} strokeWidth={1.8} />
          </View>
          <PremiumFeatureCard style={styles.breakdown}>
            <View style={styles.rubricHintRow}>
              <Text style={styles.rubricHint}>{t('answerEvaluation.rubricHint')}</Text>
            </View>
            <View style={styles.progressBlock}>
              <View style={styles.progressLabelRow}>
                <FileText size={14} color={theme.colors.brand.primary} strokeWidth={1.8} />
                <Text style={styles.progressLabel}>{t('answerEvaluation.content')}</Text>
                <Text style={styles.weightHint}>{t('answerEvaluation.weightContent')}</Text>
                <Text style={styles.scoreHint}>
                  {formatNumber(subScores.content)}/{formatNumber(maxMarks)}
                </Text>
              </View>
              <ProgressBar
                value={subScores.content}
                max={maxMarks}
                variant="primary"
                showValue={false}
                accessibilityLabel={t('answerEvaluation.content')}
              />
            </View>
            <View style={styles.progressBlock}>
              <View style={styles.progressLabelRow}>
                <LayoutList size={14} color={theme.colors.accent.teal} strokeWidth={1.8} />
                <Text style={styles.progressLabel}>{t('answerEvaluation.structure')}</Text>
                <Text style={styles.weightHint}>{t('answerEvaluation.weightStructure')}</Text>
                <Text style={styles.scoreHint}>
                  {formatNumber(subScores.structure)}/{formatNumber(maxMarks)}
                </Text>
              </View>
              <ProgressBar
                value={subScores.structure}
                max={maxMarks}
                variant="teal"
                showValue={false}
                accessibilityLabel={t('answerEvaluation.structure')}
              />
            </View>
            <View style={styles.progressBlock}>
              <View style={styles.progressLabelRow}>
                <MessageSquareText size={14} color={PREMIUM.goldDeep} strokeWidth={1.8} />
                <Text style={styles.progressLabel}>{t('answerEvaluation.clarity')}</Text>
                <Text style={styles.weightHint}>{t('answerEvaluation.weightClarity')}</Text>
                <Text style={styles.scoreHint}>
                  {formatNumber(subScores.clarity)}/{formatNumber(maxMarks)}
                </Text>
              </View>
              <ProgressBar
                value={subScores.clarity}
                max={maxMarks}
                variant="gold"
                showValue={false}
                accessibilityLabel={t('answerEvaluation.clarity')}
              />
            </View>
          </PremiumFeatureCard>

          {strengths.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <PremiumSectionLabel title={t('answerEvaluation.strengths')} compact />
                <ThumbsUp size={16} color={PREMIUM.sage} strokeWidth={1.8} />
              </View>
              <PremiumFeatureCard style={styles.feedbackCard}>
                {strengths.map((item) => (
                  <FeedbackRow
                    key={item}
                    text={item}
                    icon={<CheckCircle2 size={16} color={PREMIUM.sage} strokeWidth={1.8} />}
                    styles={styles}
                  />
                ))}
              </PremiumFeatureCard>
            </>
          ) : null}

          {improvements.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <PremiumSectionLabel title={t('answerEvaluation.whatToImprove')} compact />
                <Target size={16} color={theme.colors.semantic.warning} strokeWidth={1.8} />
              </View>
              <PremiumFeatureCard style={styles.feedbackCard}>
                {improvements.map((item, index) => (
                  <FeedbackRow
                    key={item}
                    text={item}
                    index={index}
                    icon={<Lightbulb size={16} color={theme.colors.semantic.warning} strokeWidth={1.8} />}
                    styles={styles}
                  />
                ))}
              </PremiumFeatureCard>
            </>
          ) : null}

          {nextSteps.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <PremiumSectionLabel title={t('answerEvaluation.nextSteps')} compact />
                <ArrowRight size={16} color={PREMIUM.goldDeep} strokeWidth={1.8} />
              </View>
              <AIGoldCard style={styles.nextStepsCard}>
                {nextSteps.map((item, index) => (
                  <FeedbackRow
                    key={item}
                    text={item}
                    index={index}
                    icon={<ArrowRight size={16} color={PREMIUM.goldDeep} strokeWidth={1.8} />}
                    styles={styles}
                  />
                ))}
              </AIGoldCard>
            </>
          ) : null}

          <Button
            label={t('answerEvaluation.evaluateAnother')}
            variant="primary"
            fullWidth
            onPress={handleNewEvaluation}
          />
          <Button
            label={t('answerEvaluation.reportEvaluation')}
            variant="ghost"
            fullWidth
            onPress={handleReport}
            disabled={reportMutation.isPending}
          />
        </View>
      ) : null}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing['3xl'],
    },
    form: {
      gap: theme.spacing.md,
    },
    formHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    formHeaderText: {
      flex: 1,
      gap: 4,
    },
    formEyebrow: {
      ...theme.typography.presets.label,
      color: PREMIUM.ink,
      fontWeight: '800',
    },
    formHint: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      lineHeight: 18,
    },
    questionInput: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    answerInput: {
      minHeight: 132,
      textAlignVertical: 'top',
    },
    scanRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    scanChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: PREMIUM.tileBg,
      borderWidth: 1,
      borderColor: PREMIUM.goldBorder,
    },
    scanChipText: {
      ...theme.typography.presets.caption,
      color: PREMIUM.ink,
      fontWeight: '700',
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
      fontWeight: '700',
    },
    loadingCard: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xl,
    },
    loadingTitle: {
      ...theme.typography.presets.h3,
      color: PREMIUM.ink,
      textAlign: 'center',
    },
    loadingHint: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      textAlign: 'center',
      lineHeight: 18,
    },
    results: {
      gap: theme.spacing.md,
    },
    bandPill: {
      alignSelf: 'flex-start',
      marginTop: theme.spacing.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      zIndex: 1,
    },
    bandText: {
      ...theme.typography.presets.caption,
      color: '#FFFFFF',
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 6,
    },
    breakdown: {
      gap: theme.spacing.md,
    },
    rubricHintRow: {
      marginBottom: 2,
    },
    rubricHint: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      lineHeight: 17,
    },
    progressBlock: {
      gap: theme.spacing.xs,
    },
    progressLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    progressLabel: {
      ...theme.typography.presets.caption,
      color: PREMIUM.ink,
      fontWeight: '700',
      flex: 1,
    },
    weightHint: {
      ...theme.typography.presets.caption,
      color: PREMIUM.sectionLabel,
      fontWeight: '600',
    },
    scoreHint: {
      ...theme.typography.presets.caption,
      color: PREMIUM.ink,
      fontWeight: '800',
    },
    feedbackCard: {
      gap: theme.spacing.md,
    },
    nextStepsCard: {
      gap: theme.spacing.md,
    },
    feedbackRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'flex-start',
    },
    feedbackIcon: {
      marginTop: 2,
    },
    feedbackBody: {
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'flex-start',
    },
    feedbackIndex: {
      ...theme.typography.presets.caption,
      color: PREMIUM.goldDeep,
      fontWeight: '800',
      minWidth: 14,
      marginTop: 1,
    },
    feedbackText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      flex: 1,
      lineHeight: 22,
    },
    lockedCard: {
      gap: theme.spacing.md,
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    lockedTitle: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    lockedBody: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
