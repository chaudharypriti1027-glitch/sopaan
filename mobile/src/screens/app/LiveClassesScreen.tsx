import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, BellOff, ChevronRight, PlayCircle, Radio, Sparkles, Users } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Button, QueryStateView, Screen, SectionTitle } from '../../components';
import { LIVE } from '../../components/live/liveTheme';
import { useLiveClassReminder, useLiveClasses, useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import type { LiveClass } from '../../api/liveClasses';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';

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

  if (!item.recordingUrl || item.recordingStatus !== 'ready') {
    return null;
  }

  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)}>
      <View style={styles.card}>
        <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? LIVE.gold }]} />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>{item.examTag}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.instructor} · {t('durationMin', { count: item.durationMin })}
          </Text>
          <View style={styles.playRow}>
            <PlayCircle size={18} color={LIVE.navy} />
            <Text style={styles.playLabel}>{t('watchRecording')}</Text>
            <ChevronRight size={16} color={LIVE.faint} />
          </View>
        </View>
      </View>
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
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? LIVE.navy }]} />
      <View style={styles.body}>
        <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)}>
          <Text style={styles.eyebrow}>{item.examTag}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.instructor} · {t('durationMin', { count: item.durationMin })}
          </Text>
          <Text style={styles.when}>{formatWhen(item.startsAt ?? item.scheduledAt)}</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={toggleReminder} style={styles.reminderBtn} hitSlop={8}>
            {item.reminderSet ? (
              <BellOff size={16} color={LIVE.goldDeep} />
            ) : (
              <Bell size={16} color={LIVE.muted} />
            )}
            <Text style={styles.reminderLabel}>
              {item.reminderSet ? t('reminderOn') : t('setReminder')}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.viewBtn}>
            <Text style={styles.viewLabel}>{t('viewClass')}</Text>
            <ChevronRight size={16} color={LIVE.navy} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function LiveClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClasses' });
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const liveQuery = useLiveClasses();
  const { refetch, isFetching, data, isLoading, isError } = liveQuery;
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const openViewer = (liveClassId: string) => {
    const allClasses = [
      ...(data?.liveNow ? [data.liveNow] : []),
      ...(data?.scheduled ?? []),
      ...(data?.recorded ?? []),
    ];
    const item = allClasses.find((cls) => cls.id === liveClassId);
    const isScheduled = item?.status === 'scheduled';
    const hasReadyRecording =
      item?.status === 'ended' &&
      Boolean(item.recordingUrl) &&
      item.recordingStatus === 'ready';

    if (!data?.streamingConfigured && !hasReadyRecording && !isScheduled) {
      Alert.alert(t('comingSoonAlert'), data?.message ?? t('comingSoonDefault'));
      return;
    }

    navigation.navigate('LiveClassViewer', { liveClassId });
  };

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing || isFetching}
            onRefresh={() => void onRefresh()}
            tintColor={LIVE.gold}
            colors={[LIVE.gold]}
          />
        ),
      }}
    >
      <LinearGradient
        colors={[LIVE.listBgTop, LIVE.listBg, LIVE.listBgMid]}
        locations={[0, 0.45, 1]}
        style={styles.bg}
        pointerEvents="none"
      />

      <View style={styles.body}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('title')}</Text>
        <Text style={styles.heroSubtitle}>{t('subtitle')}</Text>
      </View>

      {data?.comingSoon ? (
        <View style={styles.comingSoon}>
          <Sparkles size={20} color={LIVE.gold} />
          <View style={styles.comingSoonText}>
            <Text style={styles.comingSoonTitle}>{t('comingSoon')}</Text>
            <Text style={styles.comingSoonBody}>
              {data.message ?? t('comingSoonDefault')}
            </Text>
          </View>
        </View>
      ) : null}

      <QueryStateView
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        isOffline={isOffline}
        hasData={Boolean(data)}
        onRetry={() => void refetch()}
      >
        <>
          {data?.liveNow ? (
            <View style={styles.section}>
              <SectionTitle title={t('liveNow')} />
              <LinearGradient
                colors={[LIVE.navy2, LIVE.navyDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liveCard}
              >
                <View style={styles.liveHeader}>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.livePillText}>LIVE</Text>
                  </View>
                  <Radio size={18} color={LIVE.goldLt} />
                </View>
                <Text style={styles.liveTitle}>{data.liveNow.title}</Text>
                <Text style={styles.liveMeta}>
                  {data.liveNow.instructor}
                  {data.liveNow.topic ? ` · ${data.liveNow.topic}` : ''}
                </Text>
                <View style={styles.liveViewers}>
                  <Users size={14} color="#FFFFFF" />
                  <Text style={styles.liveViewerText}>
                    {t('watching', {
                      count: data.liveNow.attendeeCount ?? data.liveNow.viewers ?? 0,
                    })}
                  </Text>
                </View>
                <Button
                  label={data.streamingConfigured ? t('joinLive') : t('previewUnavailable')}
                  onPress={() => openViewer(data.liveNow!.id)}
                  fullWidth
                />
              </LinearGradient>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionTitle title={t('scheduled')} />
            <View style={styles.list}>
              {(data?.scheduled ?? []).length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.empty}>{t('noUpcoming')}</Text>
                </View>
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
      </View>
    </Screen>
  );
}

function createCardStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: '#ECE8DD',
      ...platformShadow({ color: LIVE.navy, offsetY: 12, opacity: 0.14, radius: 20, elevation: 4 }),
    },
    accent: { width: 4 },
    body: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.xs },
    eyebrow: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: LIVE.faint,
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.ink,
    },
    meta: { ...theme.typography.presets.caption, color: LIVE.muted },
    when: { ...theme.typography.presets.caption, color: LIVE.faint },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
      gap: theme.spacing.md,
    },
    reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    reminderLabel: { ...theme.typography.presets.caption, color: LIVE.goldDeep },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewLabel: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.navy,
    },
    playRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.sm },
    playLabel: { ...theme.typography.presets.caption, color: LIVE.navy, flex: 1 },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    bg: {
      ...StyleSheet.absoluteFillObject,
    },
    body: {
      gap: theme.spacing.lg,
      zIndex: 1,
    },
    hero: {
      gap: 4,
      marginBottom: 4,
    },
    heroTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: LIVE.ink,
    },
    heroSubtitle: {
      ...theme.typography.presets.body,
      color: LIVE.muted,
    },
    comingSoon: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
      backgroundColor: 'rgba(194,154,78,0.12)',
      borderWidth: 1,
      borderColor: LIVE.gold,
      borderRadius: 18,
      padding: theme.spacing.lg,
    },
    comingSoonText: { flex: 1, gap: theme.spacing.xs },
    comingSoonTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.ink,
    },
    comingSoonBody: { ...theme.typography.presets.caption, color: LIVE.muted },
    section: { gap: theme.spacing.md },
    liveCard: {
      gap: theme.spacing.sm,
      borderRadius: 22,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(226,201,127,0.2)',
      ...platformShadow({ color: LIVE.navyDeep, offsetY: 20, opacity: 0.45, radius: 24, elevation: 8 }),
    },
    liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: LIVE.red,
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    livePillText: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#FFFFFF',
    },
    liveTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: '#FFFFFF',
    },
    liveMeta: { ...theme.typography.presets.caption, color: 'rgba(255,255,255,0.75)' },
    liveViewers: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveViewerText: { ...theme.typography.presets.caption, color: 'rgba(255,255,255,0.85)' },
    list: { gap: theme.spacing.md },
    emptyCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: '#ECE8DD',
      padding: theme.spacing.lg,
    },
    empty: { ...theme.typography.presets.body, color: LIVE.muted },
  });
}
