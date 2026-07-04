import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, BellOff, ChevronRight, PlayCircle, Radio, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
  onOpen: (liveClassId: string) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClasses' });
  const styles = useMemo(() => createCardStyles(theme), [theme]);

  if (!item.recordingUrl) {
    return null;
  }

  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)}>
      <Card style={styles.scheduledCard}>
        <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? theme.colors.brand.primary }]} />
        <View style={styles.scheduledBody}>
          <Eyebrow>{item.examTag}</Eyebrow>
          <Text style={styles.scheduledTitle}>{item.title}</Text>
          <Text style={styles.scheduledMeta}>
            {item.instructor} · {t('durationMin', { count: item.durationMin })}
          </Text>
          <View style={styles.playRow}>
            <PlayCircle size={18} color={theme.colors.brand.primary} />
            <Text style={styles.playLabel}>{t('watchRecording')}</Text>
            <ChevronRight size={16} color={theme.colors.text.tertiary} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function ScheduledCard({
  item,
  onOpen,
}: {
  item: LiveClass;
  onOpen: (liveClassId: string) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClasses' });
  const styles = useMemo(() => createCardStyles(theme), [theme]);
  const reminderMutation = useLiveClassReminder();

  const toggleReminder = () => {
    reminderMutation.mutate(
      { id: item.id, enabled: !item.reminderSet },
      {
        onSuccess: () =>
          Alert.alert(
            item.reminderSet ? t('reminderRemoved') : t('reminderSet'),
            item.reminderSet ? t('reminderRemovedBody') : t('reminderSetBody'),
          ),
        onError: (err) => Alert.alert(t('reminderFailed'), String(err)),
      },
    );
  };

  return (
    <Card style={styles.scheduledCard}>
      <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? theme.colors.brand.primary }]} />
      <View style={styles.scheduledBody}>
        <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)}>
          <Eyebrow>{item.examTag}</Eyebrow>
          <Text style={styles.scheduledTitle}>{item.title}</Text>
          <Text style={styles.scheduledMeta}>
            {item.instructor} · {t('durationMin', { count: item.durationMin })}
          </Text>
          <Text style={styles.scheduledWhen}>{formatWhen(item.startsAt ?? item.scheduledAt)}</Text>
        </Pressable>
        <View style={styles.scheduledActions}>
          <Pressable onPress={toggleReminder} style={styles.reminderBtn} hitSlop={8}>
            {item.reminderSet ? (
              <BellOff size={16} color={theme.colors.brand.primary} />
            ) : (
              <Bell size={16} color={theme.colors.text.secondary} />
            )}
            <Text style={styles.reminderLabel}>
              {item.reminderSet ? t('reminderOn') : t('setReminder')}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.viewBtn}>
            <Text style={styles.viewLabel}>{t('viewClass')}</Text>
            <ChevronRight size={16} color={theme.colors.brand.primary} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

export function LiveClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClasses' });
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const liveQuery = useLiveClasses();
  const data = liveQuery.data;

  const openViewer = (liveClassId: string) => {
    if (!data?.streamingConfigured) {
      Alert.alert(t('comingSoonAlert'), data?.message ?? t('comingSoonDefault'));
      return;
    }

    navigation.navigate('LiveClassViewer', { liveClassId });
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title={t('title')} subtitle={t('subtitle')} />

      {data?.comingSoon ? (
        <Card style={styles.comingSoon}>
          <Sparkles size={20} color={theme.colors.accent.gold} />
          <View style={styles.comingSoonText}>
            <Text style={styles.comingSoonTitle}>{t('comingSoon')}</Text>
            <Text style={styles.comingSoonBody}>
              {data.message ?? t('comingSoonDefault')}
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
              <SectionTitle title={t('liveNow')} />
              <Card style={{ ...styles.liveCard, borderColor: theme.colors.semantic.error }}>
                <View style={styles.liveHeader}>
                  <Radio size={18} color={theme.colors.semantic.error} />
                  <Pill label="LIVE" variant="coral" />
                </View>
                <Text style={styles.liveTitle}>{data.liveNow.title}</Text>
                <Text style={styles.liveMeta}>
                  {data.liveNow.instructor} ·{' '}
                  {t('watching', {
                    count: data.liveNow.attendeeCount ?? data.liveNow.viewers ?? 0,
                  })}
                </Text>
                <Button
                  label={data.streamingConfigured ? t('joinLive') : t('previewUnavailable')}
                  onPress={() => openViewer(data.liveNow!.id)}
                  disabled={!data.streamingConfigured}
                  fullWidth
                />
              </Card>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionTitle title={t('scheduled')} />
            <View style={styles.list}>
              {(data?.scheduled ?? []).length === 0 ? (
                <Card>
                  <Text style={styles.empty}>{t('noUpcoming')}</Text>
                </Card>
              ) : (
                (data?.scheduled ?? []).map((item) => (
                  <ScheduledCard key={item.id} item={item} onOpen={openViewer} />
                ))
              )}
            </View>
          </View>

          {(data?.recorded ?? []).length > 0 ? (
            <View style={styles.section}>
              <SectionTitle title={t('recorded')} />
              <View style={styles.list}>
                {(data?.recorded ?? []).map((item) => (
                  <RecordedCard key={item.id} item={item} onOpen={openViewer} />
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
    scheduledActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
      gap: theme.spacing.md,
    },
    reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    reminderLabel: { ...theme.typography.presets.caption, color: theme.colors.brand.primary },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewLabel: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.brand.primary,
    },
    playRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.sm },
    playLabel: { ...theme.typography.presets.caption, color: theme.colors.brand.primary, flex: 1 },
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
