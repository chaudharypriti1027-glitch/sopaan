import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowRight, Bell, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { RankRing } from '../RankRing';
import { Text } from '../Text';
import { avatarDisplayToPremiumProps } from '../profile/avatarDisplay';
import { PremiumAvatar } from '../profile/PremiumAvatar';
import type { AvatarDisplay } from '../profile/useAvatarSelection';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { GoalDots } from './GoalDots';
import { HomeHeroBackground } from './HomeHeroBackground';
import { HeroIcon3D, HomeFlameStatIcon } from './HomePremiumIcon';
import { HomePremiumButton } from './HomePremiumButton';
import { HOME_UI, homeFeedCard, homePressFeedback } from './homeTheme';
import { WeekStrip } from './WeekStrip';

const DAILY_GOAL_TOTAL = 3;

type HomeHeroScrollProps = {
  greeting: HomeFeed['greeting'];
  avatarDisplay: AvatarDisplay;
  streak: HomeFeed['streak'];
  rank: HomeFeed['rank'];
  countdown?: HomeFeed['countdown'];
  dailyChallenge: HomeFeed['dailyChallenge'];
  studyActive?: boolean;
  onNotificationsPress?: () => void;
  onAvatarPress?: () => void;
  onGoalPress?: () => void;
  onRankCtaPress?: () => void;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function computeGoalProgress(
  streak: HomeFeed['streak'],
  dailyChallenge: HomeFeed['dailyChallenge'],
  studyActive: boolean,
) {
  let done = 0;
  if (streak.todayDone) done += 1;
  if (dailyChallenge?.status === 'done') done += 1;
  if (studyActive) done += 1;
  return { done: Math.min(done, DAILY_GOAL_TOTAL), total: DAILY_GOAL_TOTAL };
}

export function HomeHeroScroll({
  greeting,
  avatarDisplay,
  streak,
  rank,
  countdown,
  dailyChallenge,
  studyActive = false,
  onNotificationsPress,
  onAvatarPress,
  onGoalPress,
  onRankCtaPress,
}: HomeHeroScrollProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const goal = computeGoalProgress(streak, dailyChallenge, studyActive);
  const airLabel = rank.air != null ? `#${rank.air}` : '—';
  const hasRank = rank.air != null;
  const rankDelta = rank.deltaWeek > 0 ? rank.deltaWeek : null;
  const avatarProps = avatarDisplayToPremiumProps(avatarDisplay, greeting.name);

  return (
    <View style={styles.heroWrap}>
      <View style={styles.navyHero}>
        <HomeHeroBackground />

        <View style={styles.greetRow} testID="home-section-greeting">
          <PremiumAvatar
            name={greeting.name}
            photoUri={avatarProps.photoUri}
            preset={avatarProps.preset}
            size="hero"
            variant="hero"
            onPress={onAvatarPress}
            accessibilityLabel={t('home.avatarA11y', { name: firstName(greeting.name) })}
            testID="home-hero-avatar"
          />

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
              style={({ pressed }) => [styles.bellWrap, pressed && styles.pressed]}
            >
              <HeroIcon3D Icon={Bell} tone="slate" size="sm" />
              {greeting.unreadCount > 0 ? <View style={styles.bellDot} /> : null}
            </Pressable>
          ) : null}
        </View>

        <WeekStrip streakDays={streak.current} />

        {countdown ? (
          <View style={styles.countdownChip} testID="home-section-countdown">
            <HeroIcon3D Icon={Calendar} tone="gold" size="sm" />
            <NumText style={styles.countdownNum}>{countdown.daysLeft}</NumText>
            <Text style={styles.countdownLabel}>
              {t('home.daysToExamSuffix', { examName: countdown.examName })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.goalFloat} testID="home-section-streak">
        <View style={styles.goalCard}>
          <Pressable
            accessibilityRole="button"
            onPress={onGoalPress}
            disabled={!onGoalPress}
            style={({ pressed }) => [styles.goalBody, pressed && onGoalPress && styles.pressed]}
          >
            <View style={styles.goalRow}>
              <HomeFlameStatIcon value={streak.current} />

              <View style={styles.goalMid}>
                <Text style={styles.goalLabel}>{t('home.todaysGoal')}</Text>
                <Text style={styles.goalTitle}>
                  {t('home.goalProgress', { done: goal.done, total: goal.total })}
                </Text>
                <GoalDots done={goal.done} total={goal.total} />
              </View>

              <RankRing
                value={rank.ringPct}
                max={100}
                label={t('home.airAbbrev')}
                displayValue={airLabel}
                size={80}
                strokeWidth={7}
                style={styles.airRing}
              />
            </View>
          </Pressable>

          <View style={styles.goalFooter}>
            <View style={styles.rankCol}>
              <Text style={styles.rankHint}>
                {hasRank ? t('home.allIndiaRankNumber', { rank: rank.air }) : t('home.noRankYet')}
              </Text>
              {rankDelta != null ? (
                <Text style={styles.rankDelta}>{t('home.rankUpWeek', { count: rankDelta })}</Text>
              ) : null}
            </View>
              {!hasRank && onRankCtaPress ? (
                <HomePremiumButton
                  label={t('home.takeTestToRank')}
                  variant="outline"
                  size="sm"
                  trailingIcon={ArrowRight}
                  onPress={onRankCtaPress}
                />
              ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    heroWrap: {
      zIndex: 2,
    },
    navyHero: {
      paddingTop: topInset + 14,
      paddingHorizontal: 20,
      paddingBottom: 52,
      overflow: 'hidden',
    },
    greetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      marginBottom: 4,
      zIndex: 2,
    },
    greetText: { flex: 1 },
    greetSub: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.58)',
      letterSpacing: 0.4,
      marginBottom: 2,
      fontWeight: '600',
    },
    greetName: {
      fontSize: 24,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.6,
    },
    bellWrap: {
      position: 'relative',
    },
    bellDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: '#E3C97F',
      borderWidth: 2,
      borderColor: '#1F2648',
      zIndex: 3,
    },
    countdownChip: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.07)',
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
      color: 'rgba(255,255,255,0.68)',
    },
    goalFloat: {
      marginTop: -38,
      marginBottom: 6,
      marginHorizontal: HOME_UI.horizontalPad,
      zIndex: 5,
    },
    goalCard: {
      ...homeFeedCard(),
      borderRadius: HOME_UI.cardRadiusLg,
    },
    goalBody: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 14,
    },
    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    goalMid: { flex: 1 },
    goalLabel: {
      fontSize: 11,
      color: HOME_UI.muted,
      fontWeight: '600',
      marginBottom: 2,
    },
    goalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: HOME_UI.ink,
      letterSpacing: -0.35,
      marginBottom: 10,
    },
    airRing: {
      flexShrink: 0,
    },
    goalFooter: {
      borderTopWidth: 1,
      borderTopColor: HOME_UI.border,
      paddingVertical: 13,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: HOME_UI.surface,
    },
    rankHint: {
      fontSize: 12,
      color: HOME_UI.muted,
      fontWeight: '600',
    },
    rankCol: {
      flex: 1,
      gap: 2,
    },
    rankDelta: {
      fontSize: 11,
      fontWeight: '700',
      color: HOME_UI.sageDeep,
    },
    pressed: homePressFeedback,
  });
}
