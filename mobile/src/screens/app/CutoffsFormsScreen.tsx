import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExternalLink, FileText, TrendingUp } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Eyebrow, Pill, PremiumHeroCard, Screen, SectionTitle } from '../../components';
import { useExams, useExam, useGoalRoadmap, useProfile } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import type { Exam } from '../../api/types';
import { useTheme } from '../../theme';
import { useFormat } from '../../i18n/useFormat';

type CutoffsNav = NativeStackNavigationProp<MainStackParamList, 'CutoffsForms'>;

function resolveExamForTrack(exams: Exam[], track: string | undefined): Exam | undefined {
  if (!track) return exams[0];
  const normalized = track.toLowerCase();
  return (
    exams.find(
      (exam) =>
        exam.name.toLowerCase() === normalized ||
        exam.code?.toLowerCase() === normalized.replace(/\s+/g, '-') ||
        exam.category?.toLowerCase() === normalized,
    ) ?? exams.find((exam) => exam.name.toLowerCase().includes(normalized.split(' ')[0] ?? '')) ??
    exams[0]
  );
}

export function CutoffsFormsScreen() {
  const navigation = useNavigation<CutoffsNav>();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatNumber } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const examsQuery = useExams({ limit: 20 });
  const goalQuery = useGoalRoadmap(Boolean(profileQuery.data?.profile.goal?.examTrack));

  const examTrack = profileQuery.data?.profile.goal?.examTrack;
  const category = profileQuery.data?.profile.category ?? 'GEN';
  const goalExamId = (goalQuery.data?.exam as Exam | undefined)?.id;
  const examDetailQuery = useExam(goalExamId);
  const exam = useMemo(() => {
    if (examDetailQuery.data) return examDetailQuery.data;
    const fromGoal = goalQuery.data?.exam as Exam | undefined;
    if (fromGoal?.cutoffs?.length) return fromGoal;
    return resolveExamForTrack(examsQuery.data?.items ?? [], examTrack);
  }, [examDetailQuery.data, examTrack, examsQuery.data?.items, goalQuery.data?.exam]);

  const cutoffs = exam?.cutoffs ?? [];
  const applyDates = (exam?.importantDates ?? []).filter(
    (d) => d.type === 'apply' || d.type === 'open',
  );
  const isLoading =
    profileQuery.isLoading ||
    examsQuery.isLoading ||
    goalQuery.isLoading ||
    (Boolean(goalExamId) && examDetailQuery.isLoading);

  if (isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Eyebrow>{t('cutoffsForms.eyebrow')}</Eyebrow>
      <SectionTitle
        title={t('cutoffsForms.title')}
        subtitle={exam ? t('cutoffsForms.subtitle', { exam: exam.name }) : t('cutoffsForms.subtitleGeneric')}
      />

      {exam ? (
        <PremiumHeroCard
          icon={<TrendingUp size={24} color="#FFFFFF" strokeWidth={1.8} />}
          eyebrow={exam.category ?? t('cutoffsForms.eyebrow')}
          title={exam.name}
          trailing={<Pill label={category} variant="primary" />}
          hint={
            exam.vacancies != null
              ? t('cutoffsForms.vacancies', { count: formatNumber(exam.vacancies) })
              : undefined
          }
        >
          <Button
            label={t('cutoffsForms.viewExamDetail')}
            variant="gold"
            size="sm"
            onPress={() => navigation.navigate('ExamDetail', { examId: exam.id })}
          />
        </PremiumHeroCard>
      ) : null}

      <View style={styles.section}>
        <SectionTitle title={t('cutoffsForms.cutoffsTitle')} />
        {cutoffs.length > 0 ? (
          <Card padded={false}>
            {cutoffs.map((row, index) => (
              <View key={`${row.year}-${row.category}`}>
                <View style={styles.cutoffRow}>
                  <View style={styles.cutoffLeft}>
                    <Text style={styles.cutoffCategory}>{row.category}</Text>
                    <Text style={styles.cutoffYear}>{row.year}</Text>
                  </View>
                  <Text style={styles.cutoffMarks}>{row.marks}</Text>
                </View>
                {index < cutoffs.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <Text style={styles.empty}>{t('cutoffsForms.noCutoffs')}</Text>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle title={t('cutoffsForms.formsTitle')} />
        <Card style={styles.formsCard}>
          {applyDates.length > 0 ? (
            applyDates.map((entry) => (
              <View key={entry.label} style={styles.formRow}>
                <FileText size={18} color={theme.colors.brand.primary} />
                <View style={styles.formText}>
                  <Text style={styles.formLabel}>{entry.label}</Text>
                  <Text style={styles.formDate}>
                    {new Date(entry.date).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>{t('cutoffsForms.noForms')}</Text>
          )}

          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL('https://ssc.nic.in')}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          >
            <ExternalLink size={16} color={theme.colors.brand.primary} />
            <Text style={styles.linkText}>{t('cutoffsForms.officialPortal')}</Text>
          </Pressable>
        </Card>
      </View>

      <Button
        label={t('cutoffsForms.openCalendar')}
        fullWidth
        onPress={() => navigation.navigate('ExamCalendar')}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.xl,
      paddingBottom: theme.spacing['4xl'],
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      gap: theme.spacing.md,
    },
    cutoffRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    cutoffLeft: {
      gap: theme.spacing.xs / 2,
    },
    cutoffCategory: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    cutoffYear: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    cutoffMarks: {
      ...theme.typography.presets.stat,
      color: theme.colors.brand.primary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border.subtle,
      marginLeft: theme.spacing.lg,
    },
    formsCard: {
      gap: theme.spacing.md,
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    formText: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    formLabel: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    formDate: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.subtle,
    },
    linkText: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
    },
    pressed: {
      opacity: 0.85,
    },
    empty: {
      ...theme.typography.presets.body,
      color: theme.colors.text.tertiary,
    },
  });
}
