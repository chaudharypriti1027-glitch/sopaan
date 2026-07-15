import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Bell, Flame } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { avatarDisplayToPremiumProps } from '../profile/avatarDisplay';
import { PremiumAvatar } from '../profile/PremiumAvatar';
import type { AvatarDisplay } from '../profile/useAvatarSelection';
import { useTheme } from '../../theme';
import { useTodayPlanner } from '../../hooks';
import type { HomeFeed } from '../../types/home';
import { isReservedExamSentinel } from '../../utils/examTarget';
import { HomeExamCountdownBanner } from './HomeExamCountdownBanner';
import { HomeExamHubCard } from './HomeExamHubCard';
import { HomeHeroBackground } from './HomeHeroBackground';
import { HOME_UI, homePressFeedback } from './homeTheme';
import { WeekStrip } from './WeekStrip';

function needsExamSetup(countdown?: HomeFeed['countdown']) {
  return !countdown || (isReservedExamSentinel(countdown.examName) && countdown.daysLeft <= 0);
}

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
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const avatarProps = avatarDisplayToPremiumProps(avatarDisplay, greeting.name);

  const {
    sessions,
    completedCount,
    progress,
    summary,
    isLoading: planLoading,
  } = useTodayPlanner();
  const planProgressPct = Math.round(progress * 100);

  const greetingBlock = (
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
        <Text style={styles.greetSub} numberOfLines={1}>
          {greeting.message}
          {greeting.dateLabel ? ` · ${greeting.dateLabel}` : ''}
        </Text>
        <Text style={styles.greetName} numberOfLines={1}>
          {firstName(greeting.name)}
        </Text>
      </View>

      <View style={styles.streakPill} accessibilityLabel={t('home.streakDays', { count: streak.current })}>
        <Flame size={14} color="#E3A13C" strokeWidth={2} fill="#E3A13C" />
        <NumText style={styles.streakNum}>{streak.current}</NumText>
      </View>

      {onNotificationsPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.notificationsA11y')}
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.bellWrap, pressed && styles.pressed]}
        >
          <Bell size={17} color="#FFFFFF" strokeWidth={1.8} />
          {greeting.unreadCount > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      ) : null}
    </View>
  );

  const todayCard = (
    <HomeExamHubCard
      streak={streak}
      rank={rank}
      dailyChallenge={dailyChallenge}
      studyActive={studyActive}
      examName={countdown?.examName}
      daysLeft={countdown?.daysLeft}
      sessions={sessions}
      planSummary={sessions.length > 0 ? summary : undefined}
      planCompleted={completedCount}
      planTotal={sessions.length}
      planProgressPct={planProgressPct}
      planLoading={planLoading}
      onExamPlanPress={onGoalPress}
      onRankCtaPress={onRankCtaPress}
    />
  );

  return (
    <View style={styles.heroWrap}>
      <View style={styles.navyHero}>
        <HomeHeroBackground />

        {reducedMotion ? (
          greetingBlock
        ) : (
          <Animated.View entering={FadeInDown.duration(380).reduceMotion(ReduceMotion.System)}>
            {greetingBlock}
          </Animated.View>
        )}

        {reducedMotion ? (
          <WeekStrip streakDays={streak.current} />
        ) : (
          <Animated.View
            entering={FadeInDown.delay(80).duration(360).reduceMotion(ReduceMotion.System)}
          >
            <WeekStrip streakDays={streak.current} />
          </Animated.View>
        )}

        {needsExamSetup(countdown) ? (
          <HomeExamCountdownBanner countdown={countdown} onPress={onGoalPress} />
        ) : null}
      </View>

      <View style={styles.goalFloat}>
        {reducedMotion ? (
          todayCard
        ) : (
          <Animated.View
            entering={FadeInDown.delay(140).duration(420).reduceMotion(ReduceMotion.System)}
          >
            {todayCard}
          </Animated.View>
        )}
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
      paddingBottom: 56,
      overflow: 'hidden',
      borderBottomLeftRadius: HOME_UI.heroRadius,
      borderBottomRightRadius: HOME_UI.heroRadius,
    },
    greetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 2,
      zIndex: 2,
    },
    greetText: { flex: 1, minWidth: 0 },
    greetSub: {
      fontSize: 9,
      color: 'rgba(233,207,141,0.92)',
      letterSpacing: 1.4,
      marginBottom: 3,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    greetName: {
      fontSize: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      color: '#FFFFFF',
      letterSpacing: -0.3,
      lineHeight: 26,
    },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.13)',
      flexShrink: 0,
    },
    streakNum: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    bellWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.13)',
      position: 'relative',
      flexShrink: 0,
    },
    bellDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#E3A13C',
      borderWidth: 2,
      borderColor: '#1C2450',
      zIndex: 3,
    },
    goalFloat: {
      marginTop: -HOME_UI.feedHeroOverlap,
      marginBottom: 4,
      marginHorizontal: HOME_UI.horizontalPad,
      zIndex: 5,
    },
    pressed: homePressFeedback,
  });
}
