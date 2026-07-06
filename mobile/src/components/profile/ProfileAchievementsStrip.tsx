import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Badge } from '../../api/rewards';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import {
  PROFILE_ACHIEVEMENT_SLOTS,
  resolveAchievementLabelKey,
  type AchievementTone,
} from './profileUtils';
import { PROFILE, profileCard } from './profileTheme';
import { PROFILE_MOTION } from './profileMotion';

const TONE_GRADIENTS: Record<Exclude<AchievementTone, 'lock'>, readonly [string, string]> = {
  gold: ['#E3C97F', '#C29A4E'],
  sage: ['#6C9A8A', '#4C7264'],
  navy: ['#2E3766', '#1A1F3B'],
};

type ProfileAchievementsStripProps = {
  badges: Badge[];
  loading?: boolean;
  replayKey?: number;
  onPress?: () => void;
};

type DisplayItem = {
  id: string;
  label: string;
  tone: AchievementTone;
  earned: boolean;
  icon: typeof Lock;
};

function buildDisplayItems(badges: Badge[], t: (key: string) => string): DisplayItem[] {
  const earnedKeys = new Set(badges.map((badge) => badge.key));
  const items: DisplayItem[] = [];

  for (const slot of PROFILE_ACHIEVEMENT_SLOTS) {
    items.push({
      id: slot.key,
      label: t(`profile.achievements.${slot.labelKey}`),
      tone: earnedKeys.has(slot.key) ? slot.tone : 'lock',
      earned: earnedKeys.has(slot.key),
      icon: earnedKeys.has(slot.key) ? slot.icon : Lock,
    });
  }

  for (const badge of badges) {
    if (items.some((item) => item.id === badge.key)) {
      continue;
    }

    if (items.length >= 6) {
      break;
    }

    const labelKey = resolveAchievementLabelKey(badge.key);
    const translationKey = `profile.achievements.${labelKey}`;
    const translated = t(translationKey);
    const label =
      translated === translationKey ? labelKey.replace(/_/g, ' ') : translated;

    items.push({
      id: badge.key,
      label,
      tone: 'gold',
      earned: true,
      icon: PROFILE_ACHIEVEMENT_SLOTS[0].icon,
    });
  }

  while (items.length < 6) {
    items.push({
      id: `locked-${items.length}`,
      label: t('profile.achievements.locked'),
      tone: 'lock',
      earned: false,
      icon: Lock,
    });
  }

  return items.slice(0, 6);
}

function AchievementBadge({
  item,
  index,
  replayKey,
  styles,
}: {
  item: DisplayItem;
  index: number;
  replayKey: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const scale = useSharedValue(reducedMotion ? 1 : 0.4);
  const Icon = item.icon;
  const earned = item.earned && item.tone !== 'lock';

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }

    const delay = 200 + index * PROFILE_MOTION.badgeStaggerMs;
    opacity.value = 0;
    scale.value = 0.4;
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: PROFILE_MOTION.badgePopDurationMs,
        easing: PROFILE_MOTION.easePop,
      }),
    );
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration: PROFILE_MOTION.badgePopDurationMs,
        easing: PROFILE_MOTION.easePop,
      }),
    );
  }, [replayKey, index, reducedMotion, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.item}>
      <Animated.View style={animatedStyle}>
        {earned ? (
          <LinearGradient
            colors={TONE_GRADIENTS[item.tone as Exclude<AchievementTone, 'lock'>]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.badge, styles.badgeEarned]}
          >
            <View style={styles.shine} />
            <Icon size={24} color="#FFFFFF" strokeWidth={1.75} />
          </LinearGradient>
        ) : (
          <View style={[styles.badge, styles.badgeLocked]}>
            <Icon size={24} color="#B3B4C2" strokeWidth={1.75} />
          </View>
        )}
      </Animated.View>
      <Text style={styles.label} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
}

export function ProfileAchievementsStrip({
  badges,
  loading = false,
  replayKey = 0,
  onPress,
}: ProfileAchievementsStripProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const items = useMemo(() => buildDisplayItems(badges, t), [badges, t]);

  if (loading) {
    return <View style={[styles.card, styles.loading]} />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('profile.achievementsSection')}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.scrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {items.map((item, index) => (
            <AchievementBadge
              key={item.id}
              item={item}
              index={index}
              replayKey={replayKey}
              styles={styles}
            />
          ))}
        </ScrollView>
        <LinearGradient
          colors={[PROFILE.surface, 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fadeLeft}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0)', PROFILE.surface]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fadeRight}
          pointerEvents="none"
        />
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      ...profileCard(theme),
    },
    loading: {
      height: 96,
    },
    pressed: {
      opacity: 0.96,
    },
    scrollWrap: {
      position: 'relative',
    },
    fadeLeft: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 18,
      zIndex: 2,
    },
    fadeRight: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 18,
      zIndex: 2,
    },
    strip: {
      padding: 16,
      gap: 12,
    },
    item: {
      width: 58,
      alignItems: 'center',
      gap: 7,
    },
    badge: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    badgeEarned: {
      shadowColor: '#C29A4E',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
    },
    badgeLocked: {
      backgroundColor: '#F3F0E8',
    },
    shine: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    label: {
      fontSize: 9.5,
      lineHeight: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: PROFILE.muted,
      textAlign: 'center',
    },
  });
}
