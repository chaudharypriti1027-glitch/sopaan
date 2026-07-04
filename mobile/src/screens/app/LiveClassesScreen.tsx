import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, BellOff, PlayCircle, Radio, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, Eyebrow, Pill, QueryStateView, Screen, SectionTitle } from '../../components';
import { useLiveClassReminder, useLiveClasses, useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import type { LiveClass } from '../../api/liveClasses';
import { useTheme } from '../../theme';

function formatWhen(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RecordedCard({
  item,
  onOpen,
}: {
  item: LiveClass;
  onOpen: (recordingUrl: string, title: string) => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createCardStyles(theme), [theme]);

  if (!item.recordingUrl) {
    return null;
  }

  return (
    <Card style={styles.scheduledCard}>
      <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? theme.colors.brand.primary }]} />
      <View style={styles.scheduledBody}>
        <Eyebrow>{item.examTag}</Eyebrow>
        <Text style={styles.scheduledTitle}>{item.title}</Text>
        <Text style={styles.scheduledMeta}>
          {item.instructor} · {item.durationMin} min
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(item.recordingUrl!, item.title)}
          style={styles.playRow}
        >
          <PlayCircle size={18} color={theme.colors.brand.primary} />
          <Text style={styles.playLabel}>Watch recording</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function ScheduledCard({ item }: { item: LiveClass }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createCardStyles(theme), [theme]);
  const reminderMutation = useLiveClassReminder();

  const toggleReminder = () => {
    reminderMutation.mutate(
      { id: item.id, enabled: !item.reminderSet },
      {
        onSuccess: () =>
          Alert.alert(
            item.reminderSet ? 'Reminder removed' : 'Reminder set',
            item.reminderSet
              ? 'You will no longer be reminded before this class.'
              : 'We will remind you 15 minutes before the class starts.',
          ),
        onError: (err) => Alert.alert('Reminder failed', String(err)),
      },
    );
  };

  return (
    <Card style={styles.scheduledCard}>
      <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? theme.colors.brand.primary }]} />
      <View style={styles.scheduledBody}>
        <Eyebrow>{item.examTag}</Eyebrow>
        <Text style={styles.scheduledTitle}>{item.title}</Text>
        <Text style={styles.scheduledMeta}>
          {item.instructor} · {item.durationMin} min
        </Text>
        <Text style={styles.scheduledWhen}>{formatWhen(item.scheduledAt)}</Text>
        <Pressable onPress={toggleReminder} style={styles.reminderBtn} hitSlop={8}>
          {item.reminderSet ? (
            <BellOff size={16} color={theme.colors.brand.primary} />
          ) : (
            <Bell size={16} color={theme.colors.text.secondary} />
          )}
          <Text style={styles.reminderLabel}>
            {item.reminderSet ? 'Reminder on' : 'Set reminder'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export function LiveClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const liveQuery = useLiveClasses();
  const data = liveQuery.data;

  const openViewer = (liveClassId: string) => {
    if (!data?.streamingConfigured) {
      Alert.alert('Coming soon', data?.message ?? 'Live streaming is not configured yet.');
      return;
    }

    navigation.navigate('LiveClassViewer', { liveClassId });
  };

  const openRecording = (recordingUrl: string, title: string) => {
    Alert.alert('Open recording', title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Play',
        onPress: () => {
          void Linking.openURL(recordingUrl);
        },
      },
    ]);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Live classes" subtitle="Interactive sessions with faculty" />

      {data?.comingSoon ? (
        <Card style={styles.comingSoon}>
          <Sparkles size={20} color={theme.colors.accent.gold} />
          <View style={styles.comingSoonText}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonBody}>
              {data.message ?? 'Full live classroom launching soon.'}
            </Text>
          </View>
        </Card>
      ) : null}

      <QueryStateView
        isLoading={liveQuery.isLoading}
        isError={liveQuery.isError}
        isFetching={liveQuery.isFetching}
        isOffline={isOffline}
        hasData={Boolean(data)}
        onRetry={() => void liveQuery.refetch()}
      >
        <>
          {data?.liveNow ? (
            <View style={styles.section}>
              <SectionTitle title="Live now" />
              <Card style={{ ...styles.liveCard, borderColor: theme.colors.semantic.error }}>
                <View style={styles.liveHeader}>
                  <Radio size={18} color={theme.colors.semantic.error} />
                  <Pill label="LIVE" variant="coral" />
                </View>
                <Text style={styles.liveTitle}>{data.liveNow.title}</Text>
                <Text style={styles.liveMeta}>
                  {data.liveNow.instructor} · {data.liveNow.attendeeCount ?? data.liveNow.viewers ?? 0} watching
                </Text>
                <Button
                  label={data.streamingConfigured ? 'Join live class' : 'Preview unavailable'}
                  onPress={() => openViewer(data.liveNow!.id)}
                  disabled={!data.streamingConfigured}
                  fullWidth
                />
              </Card>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionTitle title="Scheduled" />
            <View style={styles.list}>
              {(data?.scheduled ?? []).length === 0 ? (
                <Card>
                  <Text style={styles.empty}>No upcoming classes scheduled.</Text>
                </Card>
              ) : (
                (data?.scheduled ?? []).map((item) => <ScheduledCard key={item.id} item={item} />)
              )}
            </View>
          </View>

          {(data?.recorded ?? []).length > 0 ? (
            <View style={styles.section}>
              <SectionTitle title="Recorded classes" />
              <View style={styles.list}>
                {(data?.recorded ?? []).map((item) => (
                  <RecordedCard key={item.id} item={item} onOpen={openRecording} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      </QueryStateView>
    </Screen>
  );
}

function createCardStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scheduledCard: { flexDirection: 'row', overflow: 'hidden', padding: 0 },
    accent: { width: 4 },
    scheduledBody: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.xs },
    scheduledTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    scheduledMeta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    scheduledWhen: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.sm },
    reminderLabel: { ...theme.typography.presets.caption, color: theme.colors.brand.primary },
    playRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.sm },
    playLabel: { ...theme.typography.presets.caption, color: theme.colors.brand.primary },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    comingSoon: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
      backgroundColor: theme.colors.accent.goldMuted,
      borderWidth: 1,
      borderColor: theme.colors.accent.gold,
    },
    comingSoonText: { flex: 1, gap: theme.spacing.xs },
    comingSoonTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    comingSoonBody: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    section: { gap: theme.spacing.md },
    liveCard: { gap: theme.spacing.sm, borderWidth: 2 },
    liveHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    liveTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    liveMeta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    list: { gap: theme.spacing.md },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
