import { Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AIBadge,
  AIGoldCard,
  Button,
  Card,
  DateChip,
  PlanTaskRow,
  Screen,
  SectionTitle,
  TextField,
  TimelineItem,
} from '../../components';
import {
  todayDateString,
  useCreatePlannerSession,
  useGenerateDayPlan,
  usePlannerSessions,
  useUpdatePlannerSession,
} from '../../hooks';
import type { PlannerSession } from '../../api/types';
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const week = useMemo(() => weekDates(selectedDate), [selectedDate]);

  const sessionsQuery = usePlannerSessions(selectedDate);
  const createSession = useCreatePlannerSession();
  const updateSession = useUpdatePlannerSession();
  const generatePlan = useGenerateDayPlan();

  const [showAdd, setShowAdd] = useState(false);
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationMin, setDurationMin] = useState('45');
  const [type, setType] = useState('study');

  const sessions = sortSessions(sessionsQuery.data?.items ?? []);

  const handleAdd = () => {
    if (!subject.trim()) {
      Alert.alert('Subject required', 'Enter what you plan to study.');
      return;
    }
    const duration = Number(durationMin);
    if (!duration || duration < 5) {
      Alert.alert('Invalid duration', 'Duration must be at least 5 minutes.');
      return;
    }

    createSession.mutate(
      {
        date: selectedDate,
        subject: subject.trim(),
        startTime,
        durationMin: duration,
        type: type.trim() || 'study',
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          setSubject('');
        },
        onError: (err) => Alert.alert('Could not add session', String(err)),
      },
    );
  };

  const handleGenerate = () => {
    generatePlan.mutate(
      { date: selectedDate },
      {
        onError: (err) => Alert.alert('AI plan failed', String(err)),
      },
    );
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Study Planner"
        subtitle="Week view with timed sessions — add your own or let AI plan the day"
      />

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
          label="Add session"
          variant="ghost"
          size="sm"
          onPress={() => setShowAdd((v) => !v)}
          style={styles.actionBtn}
        />
        <Button
          label="AI plan"
          size="sm"
          icon={<Sparkles size={16} color={theme.colors.brand.onPrimary} />}
          loading={generatePlan.isPending}
          onPress={handleGenerate}
          style={styles.actionBtn}
        />
      </View>

      {showAdd ? (
        <Card style={styles.addCard}>
          <TextField label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Polity" />
          <View style={styles.row}>
            <View style={styles.half}>
              <TextField label="Start" value={startTime} onChangeText={setStartTime} placeholder="09:00" />
            </View>
            <View style={styles.half}>
              <TextField
                label="Minutes"
                value={durationMin}
                onChangeText={setDurationMin}
                placeholder="45"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <TextField label="Type" value={type} onChangeText={setType} placeholder="study / revision / mock" />
          <Button label="Save session" onPress={handleAdd} loading={createSession.isPending} fullWidth />
        </Card>
      ) : null}

      {generatePlan.data?.summary ? (
        <AIGoldCard style={styles.summaryCard}>
          <AIBadge label="AI plan" />
          <Text style={styles.summary}>{generatePlan.data.summary}</Text>
        </AIGoldCard>
      ) : null}

      {sessionsQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : sessions.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No sessions for this day. Tap AI plan or add one manually.</Text>
        </Card>
      ) : (
        <Card style={styles.timelineCard}>
          {sessions.map((session, index) => (
            <View key={session.id}>
              <TimelineItem
                time={session.startTime}
                title={session.topic ? `${session.subject} · ${session.topic}` : session.subject}
                subtitle={
                  session.motivation ??
                  session.reason ??
                  `${session.durationMin} min · ${session.type}`
                }
                completed={session.completed}
                isLast={index === sessions.length - 1}
              />
              <PlanTaskRow
                title={session.completed ? 'Completed' : 'Mark complete'}
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
        </Card>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    weekStrip: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
    dateChip: { marginRight: theme.spacing.xs },
    actions: { flexDirection: 'row', gap: theme.spacing.sm },
    actionBtn: { flex: 1 },
    addCard: { gap: theme.spacing.md },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    half: { flex: 1 },
    summaryCard: { gap: theme.spacing.sm },
    summary: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    timelineCard: { gap: theme.spacing.sm },
    taskRow: { marginLeft: theme.spacing['2xl'] },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
