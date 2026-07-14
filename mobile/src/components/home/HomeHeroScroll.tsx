import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { avatarDisplayToPremiumProps } from '../profile/avatarDisplay';
import { PremiumAvatar } from '../profile/PremiumAvatar';
import type { AvatarDisplay } from '../profile/useAvatarSelection';
import { useTheme } from '../../theme';
import { useTodayPlanner } from '../../hooks';
import type { HomeFeed } from '../../types/home';
import { HomeExamCountdownBanner } from './HomeExamCountdownBanner';
import { HomeExamHubCard } from './HomeExamHubCard';
import { HomeHeroBackground } from './HomeHeroBackground';
import { HeroIcon3D } from './HomePremiumIcon';
import { HOME_UI, homePressFeedback } from './homeTheme';
import { WeekStrip } from './WeekStrip';

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

        <HomeExamCountdownBanner countdown={countdown} onPress={onGoalPress} />
      </View>

      <View style={styles.goalFloat}>
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
      color: '#FFFFFF',
      letterSpacing: -0.2,
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
    goalFloat: {
      marginTop: -42,
      marginBottom: 8,
      marginHorizontal: HOME_UI.horizontalPad,
      zIndex: 5,
    },
    pressed: homePressFeedback,
  });
}
