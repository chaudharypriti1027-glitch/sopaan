import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Bell, Calendar, Flame } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../Avatar';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { GoalDots } from './GoalDots';
import { HOME_UI } from './homeTheme';

const DAILY_GOAL_TOTAL = 3;

type HomeHeroScrollProps = {
  greeting: HomeFeed['greeting'];
  streak: HomeFeed['streak'];
  rank: HomeFeed['rank'];
  countdown?: HomeFeed['countdown'];
  dailyChallenge: HomeFeed['dailyChallenge'];
  onNotificationsPress?: () => void;
  onGoalPress?: () => void;
  onRankCtaPress?: () => void;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function computeGoalProgress(
  streak: HomeFeed['streak'],
  dailyChallenge: HomeFeed['dailyChallenge'],
) {
  let done = 0;
  if (streak.todayDone) done += 1;
  if (dailyChallenge?.status === 'done') done += 1;
  return { done: Math.min(done, DAILY_GOAL_TOTAL), total: DAILY_GOAL_TOTAL };
}

export function HomeHeroScroll({
  greeting,
  streak,
  rank,
  countdown,
  dailyChallenge,
  onNotificationsPress,
  onGoalPress,
  onRankCtaPress,
}: HomeHeroScrollProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const goal = computeGoalProgress(streak, dailyChallenge);
  const airLabel = rank.air != null ? `#${rank.air}` : '—';
  const hasRank = rank.air != null;
  const avatarSource = greeting.avatarUrl ? { uri: greeting.avatarUrl } : undefined;

  return (
    <LinearGradient
      colors={[...HOME_UI.heroGradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />
      <View style={[styles.blob, styles.blobC]} />

      <View style={styles.greetRow} testID="home-section-greeting">
        <LinearGradient
          colors={['#FF6B35', '#FFA265']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <Avatar name={greeting.name} source={avatarSource} size="md" style={styles.avatar} />
        </LinearGradient>

        <View style={styles.greetText}>
          <Text style={styles.greetSub}>{greeting.message}</Text>
          <Text style={styles.greetName}>{firstName(greeting.name)}</Text>
        </View>

        {onNotificationsPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.notificationsA11y')}
            onPress={onNotificationsPress}
            style={({ pressed }) => [styles.bellBtn, pressed && styles.pressed]}
          >
            <Bell size={20} color="rgba(255,255,255,0.9)" strokeWidth={1.9} />
            {greeting.unreadCount > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.streakPill}>
        <Flame size={14} color="#F97316" fill="#F97316" />
        <NumText style={styles.streakText}>
          {streak.current <= 0
            ? t('home.startStreak')
            : t('home.streakDays', { count: streak.current })}
        </NumText>
      </View>

      {countdown ? (
        <View style={styles.countdownChip} testID="home-section-countdown">
          <Calendar size={13} color="#FCD34D" strokeWidth={2} />
          <NumText style={styles.countdownNum}>{countdown.daysLeft}</NumText>
          <Text style={styles.countdownLabel}>
            {t('home.daysToExamSuffix', { examName: countdown.examName })}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onGoalPress}
        disabled={!onGoalPress}
        style={({ pressed }) => [styles.goalCard, pressed && onGoalPress && styles.pressed]}
        testID="home-section-streak"
      >
        <View style={styles.goalInner}>
          <View style={styles.goalRow}>
            <LinearGradient
              colors={['#FBBF24', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goalFlame}
            >
              <Text style={styles.flameEmoji}>🔥</Text>
            </LinearGradient>

            <View style={styles.goalMid}>
              <Text style={styles.goalLabel}>{t('home.todaysGoal')}</Text>
              <Text style={styles.goalTitle}>
                {t('home.goalProgress', { done: goal.done, total: goal.total })}
              </Text>
              <GoalDots done={goal.done} total={goal.total} variant="hero" />
            </View>

            <View style={styles.airBox}>
              <Text style={styles.airLabel}>{t('home.airAbbrev')}</Text>
              <Text style={styles.airValue}>{airLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.rankHint}>
            {hasRank ? t('home.allIndiaRankNumber', { rank: rank.air }) : t('home.noRankYet')}
          </Text>
          {!hasRank && onRankCtaPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRankCtaPress}
              style={({ pressed }) => [styles.goalCta, pressed && styles.pressed]}
            >
              <Text style={styles.goalCtaText}>{t('home.takeTestToRank')}</Text>
              <ArrowRight size={14} color="#A5B4FC" strokeWidth={2.2} />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    hero: {
      paddingTop: topInset + 12,
      paddingHorizontal: 20,
      paddingBottom: 28,
      overflow: 'hidden',
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: 'rgba(99,102,241,0.28)',
    },
    blobA: { top: -80, right: -60, width: 260, height: 260 },
    blobB: { top: 50, right: 55, width: 90, height: 90, opacity: 0.5 },
    blobC: { bottom: -40, left: -30, width: 180, height: 180 },
    greetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
      zIndex: 2,
    },
    avatarRing: {
      padding: 2.5,
      borderRadius: 16,
      borderWidth: 2.5,
      borderColor: 'rgba(255,255,255,0.22)',
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 14,
    },
    greetText: { flex: 1 },
    greetSub: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)',
      letterSpacing: 0.5,
      marginBottom: 1,
      fontWeight: '500',
    },
    greetName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    bellBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: '#FF3D5A',
      borderWidth: 2,
      borderColor: '#2E12A0',
    },
    streakPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 100,
      paddingVertical: 5,
      paddingHorizontal: 13,
      paddingLeft: 10,
      marginBottom: 20,
      zIndex: 2,
    },
    streakText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FCD34D',
    },
    countdownChip: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: -12,
      marginBottom: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      zIndex: 2,
    },
    countdownNum: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    countdownLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.65)',
    },
    goalCard: {
      backgroundColor: 'rgba(255,255,255,0.09)',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 24,
      overflow: 'hidden',
      zIndex: 2,
    },
    goalInner: { paddingHorizontal: 18, paddingTop: 18 },
    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16,
    },
    goalFlame: {
      width: 52,
      height: 52,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flameEmoji: { fontSize: 24 },
    goalMid: { flex: 1 },
    goalLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.45)',
      letterSpacing: 0.4,
      marginBottom: 3,
    },
    goalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.4,
      marginBottom: 10,
    },
    airBox: {
      width: 50,
      height: 50,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    },
    airLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.3)',
      letterSpacing: 2,
    },
    airValue: {
      fontSize: 20,
      fontWeight: '900',
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 22,
    },
    goalFooter: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
      paddingVertical: 11,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rankHint: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.35)',
      flex: 1,
    },
    goalCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    goalCtaText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#A5B4FC',
    },
    pressed: { opacity: 0.9 },
  });
}
