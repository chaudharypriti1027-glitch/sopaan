import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  BellOff,
  CalendarClock,
  CalendarX,
  ChevronRight,
  PlayCircle,
  Sparkles,
  Users,
  Video,
} from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FeatureScreenLayout,
  PremiumFeatureCard,
  QueryStateView,
  SectionTitle,
} from '../../components';
import { usePremiumDialog } from '../../components/premium';
import { LIVE } from '../../components/live/liveTheme';
import { formatLiveClassWhen } from '../../content/liveClassesContent';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import { useLiveClassReminder, useLiveClasses, useNetworkStatus, useProGate } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import type { MainStackParamList } from '../../navigation/types';
import type { LiveClass } from '../../api/liveClasses';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';

const ICON_STROKE = 1.9;

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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${t('watchRecording')}`}
      onPress={() => onOpen(item.id)}
    >
      <PremiumFeatureCard style={styles.card}>
        <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? LIVE.gold }]} />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>{item.examTag}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.instructor} · {t('durationMin', { count: item.durationMin })}
          </Text>
          <View style={styles.playRow}>
            <PlayCircle size={18} color={LIVE.navy} strokeWidth={ICON_STROKE} />
            <Text style={styles.playLabel}>{t('watchRecording')}</Text>
            <ChevronRight size={15} color={LIVE.navy} strokeWidth={2.2} />
          </View>
        </View>
      </PremiumFeatureCard>
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
  const { locale } = useFormat();
  const { alert } = usePremiumDialog();
  const styles = useMemo(() => createCardStyles(theme), [theme]);
  const reminderMutation = useLiveClassReminder();
  const whenLabel = formatLiveClassWhen(item.startsAt ?? item.scheduledAt, locale);

  const toggleReminder = () => {
    reminderMutation.mutate(
      { id: item.id, enabled: !item.reminderSet },
      {
        onSuccess: () =>
          alert({
            title: item.reminderSet ? t('reminderRemoved') : t('reminderSet'),
            message: item.reminderSet ? t('reminderRemovedBody') : t('reminderSetBody'),
            icon: 'bell',
            iconTone: 'gold',
          }),
        onError: (err) =>
          alert({
            title: t('reminderFailed'),
            message: getUserFacingMessage(err),
            icon: 'info',
            iconTone: 'coral',
          }),
      },
    );
  };

  return (
    <PremiumFeatureCard style={styles.card}>
      <View style={[styles.accent, { backgroundColor: item.thumbnailColor ?? LIVE.navy }]} />
      <View style={styles.body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${t('viewClass')}`}
          onPress={() => onOpen(item.id)}
        >
          <Text style={styles.eyebrow}>{item.examTag}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.instructor} · {t('durationMin', { count: item.durationMin })}
          </Text>
          {whenLabel ? (
            <View style={styles.whenRow}>
              <CalendarClock size={15} color={LIVE.goldDeep} strokeWidth={ICON_STROKE} />
              <Text style={styles.when}>{whenLabel}</Text>
            </View>
          ) : null}
        </Pressable>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.reminderSet ? t('reminderOn') : t('setReminder')}
            onPress={toggleReminder}
            disabled={reminderMutation.isPending}
            style={[styles.reminderBtn, item.reminderSet && styles.reminderBtnOn]}
            hitSlop={6}
          >
            {item.reminderSet ? (
              <BellOff size={16} color={LIVE.goldDeep} strokeWidth={ICON_STROKE} />
            ) : (
              <Bell size={16} color={LIVE.muted} strokeWidth={ICON_STROKE} />
            )}
            <Text style={[styles.reminderLabel, item.reminderSet && styles.reminderLabelOn]}>
              {item.reminderSet ? t('reminderOn') : t('setReminder')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('viewClass')}
            onPress={() => onOpen(item.id)}
            style={styles.viewBtn}
            hitSlop={6}
          >
            <Text style={styles.viewLabel}>{t('viewClass')}</Text>
            <ChevronRight size={16} color={LIVE.navy} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </PremiumFeatureCard>
  );
}

export function LiveClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClasses' });
  const { t: tApp } = useTranslation('app');
  const { alert } = usePremiumDialog();
  const { isPro, isLoading: isTierLoading, openPaywall } = useProGate();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const liveQuery = useLiveClasses();
  const { refetch, isFetching, data, isLoading, isError } = liveQuery;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  if (isTierLoading && !isPro) {
    return (
      <FeatureScreenLayout
        title={t('title')}
        subtitle={t('subtitle')}
        contentStyle={styles.shellBody}
      >
        <View style={styles.tierLoading}>
          <ActivityIndicator color={LIVE.goldDeep} size="large" />
        </View>
      </FeatureScreenLayout>
    );
  }

  if (!isPro) {
    return (
      <FeatureScreenLayout
        title={t('title')}
        subtitle={t('proFeature')}
        contentStyle={styles.shellBody}
      >
        <LinearGradient
          colors={[LIVE.listBgTop, LIVE.listBg, LIVE.listBgMid]}
          locations={[0, 0.45, 1]}
          style={styles.bg}
          pointerEvents="none"
        />
        <View style={styles.lockedCard}>
          <View style={styles.lockedIconWell}>
            <Video size={28} color={LIVE.goldDeep} strokeWidth={1.85} />
          </View>
          <Text style={styles.lockedTitle}>{t('lockedTitle')}</Text>
          <Text style={styles.lockedBody}>{t('lockedBody')}</Text>
          <Button
            label={tApp('manageSubscription.upgradeToPro')}
            variant="gold"
            fullWidth
            onPress={() => openPaywall()}
            accessibilityHint={tApp('manageSubscription.upgradeA11yHint')}
          />
        </View>
      </FeatureScreenLayout>
    );
  }

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
      alert({
        title: t('comingSoonAlert'),
        message: data?.message ?? t('comingSoonDefault'),
        icon: 'bell',
        iconTone: 'navy',
      });
      return;
    }

    navigation.navigate('LiveClassViewer', { liveClassId });
  };

  return (
    <FeatureScreenLayout
      title={t('title')}
      subtitle={t('subtitle')}
      contentStyle={styles.shellBody}
    >
      <LinearGradient
        colors={[LIVE.listBgTop, LIVE.listBg, LIVE.listBgMid]}
        locations={[0, 0.45, 1]}
        style={styles.bg}
        pointerEvents="none"
      />

      {data?.comingSoon ? (
        <View style={styles.comingSoon}>
          <View style={styles.comingSoonIcon}>
            <Sparkles size={18} color={LIVE.goldDeep} strokeWidth={ICON_STROKE} />
          </View>
          <View style={styles.comingSoonText}>
            <Text style={styles.comingSoonTitle}>{t('comingSoon')}</Text>
            <Text style={styles.comingSoonBody}>{data.message ?? t('comingSoonDefault')}</Text>
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
                colors={[LIVE.navy, LIVE.navy2, LIVE.navyDeep]}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liveCard}
              >
                <View style={styles.liveHeader}>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.livePillText}>{t('liveBadge')}</Text>
                  </View>
                  <View style={styles.liveViewers}>
                    <Users size={13} color="rgba(255,255,255,0.85)" strokeWidth={ICON_STROKE} />
                    <Text style={styles.liveViewerText}>
                      {t('watching', {
                        count: data.liveNow.attendeeCount ?? data.liveNow.viewers ?? 0,
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.liveTitle}>{data.liveNow.title}</Text>
                <Text style={styles.liveMeta}>
                  {data.liveNow.instructor}
                  {data.liveNow.topic ? ` · ${data.liveNow.topic}` : ''}
                </Text>
                <View style={styles.liveCta}>
                  <Button
                    label={data.streamingConfigured ? t('joinLive') : t('previewUnavailable')}
                    variant="gold"
                    onPress={() => openViewer(data.liveNow!.id)}
                    fullWidth
                  />
                </View>
              </LinearGradient>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionTitle title={t('scheduled')} />
            <View style={styles.list}>
              {(data?.scheduled ?? []).length === 0 ? (
                <View style={styles.emptyCard} accessibilityLabel={t('noUpcoming')}>
                  <View style={styles.emptyIconWell}>
                    <CalendarX size={22} color={LIVE.muted} strokeWidth={ICON_STROKE} />
                  </View>
                  <Text style={styles.emptyTitle}>{t('noUpcomingTitle')}</Text>
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
    </FeatureScreenLayout>
  );
}

function createCardStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      overflow: 'hidden',
      padding: 0,
      borderColor: LIVE.border,
      borderRadius: 18,
      ...platformShadow({ color: LIVE.shadow, offsetY: 8, opacity: 0.07, radius: 16, elevation: 3 }),
    },
    accent: { width: 4 },
    body: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, gap: 5 },
    eyebrow: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: LIVE.goldDeep,
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.ink,
      lineHeight: 21,
    },
    meta: { ...theme.typography.presets.caption, color: LIVE.muted, lineHeight: 17 },
    whenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      alignSelf: 'flex-start',
      borderRadius: 10,
      backgroundColor: LIVE.goldSoft,
      borderWidth: 1,
      borderColor: LIVE.goldBorder,
    },
    when: {
      ...theme.typography.presets.caption,
      color: LIVE.ink,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      gap: theme.spacing.sm,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: LIVE.border,
    },
    reminderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 11,
      borderRadius: 12,
      backgroundColor: LIVE.goldSoft,
      borderWidth: 1,
      borderColor: LIVE.goldBorder,
      minHeight: 38,
    },
    reminderBtnOn: {
      backgroundColor: 'rgba(201,162,75,0.2)',
      borderColor: LIVE.gold,
    },
    reminderLabel: {
      ...theme.typography.presets.caption,
      color: LIVE.muted,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    reminderLabelOn: {
      color: LIVE.goldDeep,
    },
    viewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 8,
      paddingHorizontal: 10,
      minHeight: 38,
      borderRadius: 12,
      backgroundColor: 'rgba(44,53,104,0.06)',
    },
    viewLabel: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.navy,
    },
    playRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 11,
      borderRadius: 12,
      backgroundColor: 'rgba(44,53,104,0.06)',
      alignSelf: 'flex-start',
    },
    playLabel: {
      ...theme.typography.presets.caption,
      color: LIVE.navy,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    shellBody: {
      backgroundColor: LIVE.listBg,
      position: 'relative',
      overflow: 'hidden',
    },
    lockedCard: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.md,
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 24,
      backgroundColor: LIVE.surface,
      borderWidth: 1,
      borderColor: LIVE.border,
      zIndex: 1,
      ...platformShadow({ color: LIVE.shadow, offsetY: 10, opacity: 0.08, radius: 20, elevation: 3 }),
    },
    tierLoading: {
      minHeight: 240,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lockedIconWell: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: LIVE.goldSoft,
      borderWidth: 1,
      borderColor: LIVE.goldBorder,
      marginBottom: theme.spacing.xs,
    },
    lockedTitle: {
      ...theme.typography.presets.h3,
      color: LIVE.ink,
      textAlign: 'center',
      fontFamily: theme.typography.fonts.ui.bold,
    },
    lockedBody: {
      ...theme.typography.presets.body,
      color: LIVE.muted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.xs,
    },
    bg: {
      ...StyleSheet.absoluteFillObject,
    },
    comingSoon: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
      backgroundColor: LIVE.goldSoft,
      borderWidth: 1,
      borderColor: LIVE.goldBorder,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 4,
      zIndex: 1,
    },
    comingSoonIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(201,162,75,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(201,162,75,0.28)',
    },
    comingSoonText: { flex: 1, gap: 3 },
    comingSoonTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.ink,
    },
    comingSoonBody: { ...theme.typography.presets.caption, color: LIVE.muted, lineHeight: 18 },
    section: { gap: 12, zIndex: 1, marginTop: 4 },
    liveCard: {
      gap: 10,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: 'rgba(233,207,141,0.28)',
      ...platformShadow({ color: LIVE.navyDeep, offsetY: 14, opacity: 0.32, radius: 20, elevation: 7 }),
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
      letterSpacing: 0.7,
      color: '#FFFFFF',
    },
    liveTitle: {
      fontSize: 19,
      lineHeight: 25,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 2,
    },
    liveMeta: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.72)',
      lineHeight: 18,
      marginBottom: 4,
    },
    liveViewers: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0,0,0,0.28)',
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    liveViewerText: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: 'rgba(255,255,255,0.88)',
    },
    liveCta: {
      marginTop: 6,
    },
    list: { gap: 12 },
    emptyCard: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 28,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 18,
      backgroundColor: LIVE.surface,
      borderWidth: 1,
      borderColor: LIVE.border,
    },
    emptyIconWell: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: LIVE.goldSoft,
      borderWidth: 1,
      borderColor: LIVE.goldBorder,
      marginBottom: 4,
    },
    emptyTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: LIVE.ink,
      textAlign: 'center',
    },
    empty: {
      ...theme.typography.presets.caption,
      color: LIVE.muted,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 280,
    },
  });
}
