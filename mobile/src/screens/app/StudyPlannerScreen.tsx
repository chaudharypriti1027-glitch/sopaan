import { Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AIBadge,
  AIGoldCard,
  Button,
  DateChip,
  FeatureScreenLayout,
  PlanTaskRow,
  PremiumFeatureCard,
  TextField,
  TimelineItem,
} from '../../components';
import {
  DEFAULT_STUDY_SESSION_MINUTES,
  DEFAULT_STUDY_SESSION_TYPE,
  DEFAULT_STUDY_START_TIME,
  STUDY_MIN_SESSION_MINUTES,
  STUDY_SESSION_TYPE_SUGGESTIONS,
} from '../../content/featureDefaultsContent';
import {
  todayDateString,
  useCreatePlannerSession,
  useGenerateDayPlan,
  usePlannerSessions,
  useUpdatePlannerSession,
} from '../../hooks';
import type { PlannerSession } from '../../api/types';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

function formatDateLabel(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function weekDates(anchor: string): string[] {
  const base = new Date(`${anchor}T12:00:00`);
  const day = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  });
}

function sortSessions(sessions: PlannerSession[]): PlannerSession[] {
  return [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function StudyPlannerScreen() {
  const { t } = useTranslation('app');
  const route = useRoute<RouteProp<MainStackParamList, 'StudyPlanner'>>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const typePlaceholder = STUDY_SESSION_TYPE_SUGGESTIONS.join(' / ');

  const initialDate = route.params?.date ?? todayDateString();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const week = useMemo(() => weekDates(selectedDate), [selectedDate]);

  useEffect(() => {
    if (route.params?.date) {
      setSelectedDate(route.params.date);
    }
  }, [route.params?.date]);

  const sessionsQuery = usePlannerSessions(selectedDate);
  const createSession = useCreatePlannerSession();
  const updateSession = useUpdatePlannerSession();
  const generatePlan = useGenerateDayPlan();

  const [showAdd, setShowAdd] = useState(false);
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState(DEFAULT_STUDY_START_TIME);
  const [durationMin, setDurationMin] = useState(String(DEFAULT_STUDY_SESSION_MINUTES));
  const [type, setType] = useState<string>(DEFAULT_STUDY_SESSION_TYPE);

  const sessions = sortSessions(sessionsQuery.data?.items ?? []);

  const handleAdd = () => {
    if (!subject.trim()) {
      Alert.alert(t('studyPlanner.subjectRequired'), t('studyPlanner.subjectRequiredBody'));
      return;
    }
    const duration = Number(durationMin);
    if (!duration || duration < STUDY_MIN_SESSION_MINUTES) {
      Alert.alert(t('studyPlanner.invalidDuration'), t('studyPlanner.invalidDurationBody'));
      return;
    }

    createSession.mutate(
      {
        date: selectedDate,
        subject: subject.trim(),
        startTime,
        durationMin: duration,
        type: type.trim() || DEFAULT_STUDY_SESSION_TYPE,
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          setSubject('');
        },
        onError: (err) => Alert.alert(t('studyPlanner.addFailed'), String(err)),
      },
    );
  };

  const handleGenerate = () => {
    generatePlan.mutate(
      { date: selectedDate },
      {
        onError: (err) => Alert.alert(t('studyPlanner.aiPlanFailed'), String(err)),
      },
    );
  };

  return (
    <FeatureScreenLayout title={t('studyPlanner.title')} subtitle={t('studyPlanner.subtitle')}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
        {week.map((date) => (
          <DateChip
            key={date}
            label={formatDateLabel(date)}
            selected={date === selectedDate}
            onPress={() => setSelectedDate(date)}
            style={styles.dateChip}
          />
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label={t('studyPlanner.addSession')}
          variant="ghost"
          size="sm"
          onPress={() => setShowAdd((v) => !v)}
          style={styles.actionBtn}
        />
        <Button
          label={t('studyPlanner.aiPlan')}
          size="sm"
          icon={<Sparkles size={16} color={theme.colors.brand.onPrimary} />}
          loading={generatePlan.isPending}
          onPress={handleGenerate}
          style={styles.actionBtn}
        />
      </View>

      {showAdd ? (
        <PremiumFeatureCard style={styles.addCard}>
          <TextField
            label={t('studyPlanner.subject')}
            value={subject}
            onChangeText={setSubject}
            placeholder={t('studyPlanner.subjectPlaceholder')}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <TextField
                label={t('studyPlanner.start')}
                value={startTime}
                onChangeText={setStartTime}
                placeholder={t('studyPlanner.startPlaceholder')}
              />
            </View>
            <View style={styles.half}>
              <TextField
                label={t('studyPlanner.minutes')}
                value={durationMin}
                onChangeText={setDurationMin}
                placeholder={t('studyPlanner.minutesPlaceholder')}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <TextField
            label={t('studyPlanner.type')}
            value={type}
            onChangeText={setType}
            placeholder={typePlaceholder}
          />
          <Button
            label={t('studyPlanner.saveSession')}
            onPress={handleAdd}
            loading={createSession.isPending}
            fullWidth
          />
        </PremiumFeatureCard>
      ) : null}

      {generatePlan.data?.summary ? (
        <AIGoldCard style={styles.summaryCard}>
          <AIBadge label={t('studyPlanner.aiPlan')} />
          <Text style={styles.summary}>{generatePlan.data.summary}</Text>
        </AIGoldCard>
      ) : null}

      {sessionsQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : sessions.length === 0 ? (
        <PremiumFeatureCard>
          <Text style={styles.empty}>{t('studyPlanner.empty')}</Text>
        </PremiumFeatureCard>
      ) : (
        <PremiumFeatureCard style={styles.timelineCard}>
          {sessions.map((session, index) => (
            <View key={session.id}>
              <TimelineItem
                time={session.startTime}
                title={session.topic ? `${session.subject} · ${session.topic}` : session.subject}
                subtitle={
                  session.motivation ??
                  session.reason ??
                  t('studyPlanner.sessionSubtitle', {
                    minutes: session.durationMin,
                    type: session.type,
                  })
                }
                completed={session.completed}
                isLast={index === sessions.length - 1}
              />
              <PlanTaskRow
                title={
                  session.completed ? t('studyPlanner.completed') : t('studyPlanner.markComplete')
                }
                completed={session.completed}
                onToggle={() =>
                  updateSession.mutate({
                    id: session.id,
                    input: { completed: !session.completed },
                  })
                }
                style={styles.taskRow}
              />
            </View>
          ))}
        </PremiumFeatureCard>
      )}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    weekStrip: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
    dateChip: { marginRight: theme.spacing.xs },
    actions: { flexDirection: 'row', gap: theme.spacing.sm },
    actionBtn: { flex: 1 },
    addCard: { gap: theme.spacing.md, padding: theme.spacing.md },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    half: { flex: 1 },
    summaryCard: { gap: theme.spacing.sm },
    summary: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    timelineCard: { gap: theme.spacing.sm, padding: theme.spacing.md },
    taskRow: { marginLeft: theme.spacing['2xl'] },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
