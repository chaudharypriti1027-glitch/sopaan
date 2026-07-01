import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Flame } from 'lucide-react-native';
import { NumText } from '../NumText';
import { RankRing } from '../RankRing';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { GoalDots } from './GoalDots';
import { HOME_V2, homePremiumCard } from './homeStyles';

const DAILY_GOAL_TOTAL = 3;

type StreakRankCardProps = {
  streak: HomeFeed['streak'];
  rank: HomeFeed['rank'];
  dailyChallenge: HomeFeed['dailyChallenge'];
  onPress?: () => void;
  onRankCtaPress?: () => void;
};

function computeGoalProgress(
  streak: HomeFeed['streak'],
  dailyChallenge: HomeFeed['dailyChallenge'],
) {
  let done = 0;
  if (streak.todayDone) done += 1;
  if (dailyChallenge?.status === 'done') done += 1;
  return {
    done: Math.min(done, DAILY_GOAL_TOTAL),
    total: DAILY_GOAL_TOTAL,
  };
}

export function StreakRankCard({
  streak,
  rank,
  dailyChallenge,
  onPress,
  onRankCtaPress,
}: StreakRankCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const goal = computeGoalProgress(streak, dailyChallenge);
  const airLabel = rank.air != null ? `#${rank.air}` : '—';
  const hasRank = rank.air != null;
  const hintLeft = hasRank ? `All-India Rank #${rank.air}` : 'No rank yet';
  const handleCta = onRankCtaPress ?? onPress;

  const content = (
    <>
      <View style={styles.hero}>
        <LinearGradient
          colors={['#FFF3D6', '#FDE8B8']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.flameBox}
        >
          <Flame size={17} color={theme.colors.accent.goldOn} strokeWidth={1.75} />
          <NumText style={styles.flameNum}>{streak.current}</NumText>
        </LinearGradient>

        <View style={styles.mid}>
          <Text style={styles.goalLabel}>Today&apos;s goal</Text>
          <Text style={styles.goalValue}>
            {goal.done} of {goal.total} complete
          </Text>
          <GoalDots done={goal.done} total={goal.total} />
        </View>

        <RankRing
          value={rank.ringPct}
          max={100}
          variant="primary"
          size={78}
          strokeWidth={7}
          displayValue={airLabel}
          label="AIR"
        />
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintLeft}>{hintLeft}</Text>
        {!hasRank && handleCta ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleCta}
            style={({ pressed }) => [styles.hintCta, pressed && styles.pressed]}
          >
            <Text style={styles.hintCtaText}>Take a test to rank</Text>
            <ArrowRight size={14} color={theme.colors.brand.primary} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={styles.outer}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.card}>{content}</View>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    outer: {
      marginTop: HOME_V2.bodyLift,
      zIndex: 5,
    },
    card: {
      ...homePremiumCard(theme),
      overflow: 'hidden',
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: 16,
    },
    pressed: {
      opacity: 0.98,
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    flameBox: {
      width: 60,
      height: 60,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    flameNum: {
      fontSize: 20,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: theme.colors.accent.goldOn,
      marginTop: 1,
    },
    mid: {
      flex: 1,
      gap: 1,
    },
    goalLabel: {
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
    goalValue: {
      fontSize: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: theme.colors.text.primary,
      marginTop: 1,
    },
    hint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 13,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#F0EEF8',
    },
    hintLeft: {
      flex: 1,
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
    hintCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    hintCtaText: {
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: theme.colors.brand.primary,
    },
  });
}
