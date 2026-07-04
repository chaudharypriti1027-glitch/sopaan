import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Bell, Calendar, Flame } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../Avatar';
import { GlassSurface } from '../GlassSurface';
import { NumText } from '../NumText';
import { RankRing } from '../RankRing';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { GoalDots } from './GoalDots';
import { HOME_UI } from './homeTheme';
import { platformShadow } from '../../utils/platformShadow';
import { WeekStrip } from './WeekStrip';

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
          colors={['#E3C97F', '#C29A4E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <Avatar name={greeting.name} source={avatarSource} size="md" style={styles.avatar} />
        </LinearGradient>

        <View style={styles.greetText}>
          <Text style={styles.greetSub}>
            {greeting.message}
            {greeting.dateLabel ? ` · ${greeting.dateLabel}` : ''}
          </Text>
          <Text style={styles.greetName}>{firstName(greeting.name)}</Text>
        </View>

        {onNotificationsPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.notificationsA11y')}
            onPress={onNotificationsPress}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <GlassSurface tone="dark" intensity={30} borderRadius={14} style={styles.bellBtn}>
              <Bell size={20} color="rgba(255,255,255,0.9)" strokeWidth={1.9} />
              {greeting.unreadCount > 0 ? <View style={styles.bellDot} /> : null}
            </GlassSurface>
          </Pressable>
        ) : null}
      </View>

      <WeekStrip streakDays={streak.current} />

      <GlassSurface tone="dark" intensity={22} borderRadius={100} style={styles.streakPill}>
        <Flame size={14} color="#C29A4E" fill="#C29A4E" />
        <NumText style={styles.streakText}>
          {streak.current <= 0
            ? t('home.startStreak')
            : t('home.streakDays', { count: streak.current })}
        </NumText>
      </GlassSurface>

      {countdown ? (
        <GlassSurface
          tone="dark"
          intensity={22}
          borderRadius={100}
          style={styles.countdownChip}
          testID="home-section-countdown"
        >
          <Calendar size={13} color="#E3C97F" strokeWidth={2} />
          <NumText style={styles.countdownNum}>{countdown.daysLeft}</NumText>
          <Text style={styles.countdownLabel}>
            {t('home.daysToExamSuffix', { examName: countdown.examName })}
          </Text>
        </GlassSurface>
      ) : null}

      <View testID="home-section-streak">
        <GlassSurface tone="dark" intensity={26} borderRadius={22} style={styles.goalCard}>
          <Pressable
            accessibilityRole="button"
            onPress={onGoalPress}
            disabled={!onGoalPress}
            style={({ pressed }) => [pressed && onGoalPress && styles.pressed]}
          >
            <View style={styles.goalInner}>
              <View style={styles.goalRow}>
                <LinearGradient
                  colors={['#D8B368', '#C29A4E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.goalFlame}
                >
                  <Flame size={17} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                  <NumText style={styles.goalFlameNum}>{streak.current}</NumText>
                </LinearGradient>

                <View style={styles.goalMid}>
                  <Text style={styles.goalLabel}>{t('home.todaysGoal')}</Text>
                  <Text style={styles.goalTitle}>
                    {t('home.goalProgress', { done: goal.done, total: goal.total })}
                  </Text>
                  <GoalDots done={goal.done} total={goal.total} variant="hero" />
                </View>

                <RankRing
                  value={rank.ringPct}
                  max={100}
                  label={t('home.airAbbrev')}
                  displayValue={airLabel}
                  size={80}
                  strokeWidth={6}
                  trackColor="rgba(255,255,255,0.14)"
                  accentColor="#E3C97F"
                  labelColor="rgba(255,255,255,0.45)"
                  style={styles.airRing}
                />
              </View>
            </View>
          </Pressable>

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
                <ArrowRight size={14} color="#E3C97F" strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>
        </GlassSurface>
      </View>
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
      backgroundColor: 'rgba(194,154,78,0.18)',
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
      backgroundColor: '#C29A4E',
      borderWidth: 2,
      borderColor: '#232A4D',
    },
    streakPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 5,
      paddingHorizontal: 13,
      paddingLeft: 10,
      marginBottom: 20,
      zIndex: 2,
    },
    streakText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#E3C97F',
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
      width: 60,
      height: 60,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      ...platformShadow({ color: '#C29A4E', offsetY: 10, opacity: 0.6, radius: 20, elevation: 4 }),
    },
    goalFlameNum: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 22,
    },
    goalMid: { flex: 1 },
    goalLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.45)',
      letterSpacing: 0.4,
      marginBottom: 3,
    },
    goalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    airRing: {
      flexShrink: 0,
    },
    goalFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.1)',
      paddingVertical: 14,
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
      color: '#E3C97F',
    },
    pressed: { opacity: 0.9 },
  });
}
