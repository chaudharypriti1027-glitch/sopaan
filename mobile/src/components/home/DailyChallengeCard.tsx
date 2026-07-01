import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { colors } from '../../theme/tokens';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { HOME_UI } from './homeTheme';
import { PREMIUM } from '../premium/premiumStyles';

type DailyChallengeCardProps = {
  challenge: HomeFeed['dailyChallenge'];
  onPress?: (deeplink: string) => void;
};

export function DailyChallengeCard({ challenge, onPress }: DailyChallengeCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!challenge) {
    return null;
  }

  const done = challenge.status === 'done';
  const deeplink = `/stack/Quiz/${challenge.id}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(deeplink)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[...HOME_UI.leagueGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.decor} />
        <View style={styles.iconWrap}>
          <Star size={23} color="#FFE2A6" strokeWidth={1.75} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {challenge.title || t('home.questionsToday', { count: challenge.qCount })}
          </Text>
          <Text style={styles.subtitle}>
            {t('home.challengeEarn', { coins: challenge.rewardCoins })}
          </Text>
        </View>
        <LinearGradient
          colors={done ? ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)'] : ['#E3C97F', '#C29A4E']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.cta}
        >
          <Text style={[styles.ctaLabel, done && styles.ctaLabelDone]}>
            {done ? t('home.challengeDoneMark') : t('home.challengeStart')}
          </Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderRadius: PREMIUM.cardRadius,
      overflow: 'hidden',
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.35,
      shadowRadius: 36,
      elevation: 8,
    },
    pressed: {
      opacity: 0.96,
    },
    gradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      padding: 17,
      position: 'relative',
      overflow: 'hidden',
    },
    decor: {
      position: 'absolute',
      right: -20,
      top: -40,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'rgba(255,255,255,0.09)',
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    content: {
      flex: 1,
      gap: 2,
      zIndex: 2,
    },
    title: {
      fontSize: 14.5,
      lineHeight: 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: colors.white,
    },
    subtitle: {
      fontSize: 11.5,
      lineHeight: 15,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.85)',
    },
    cta: {
      zIndex: 2,
      borderRadius: 13,
      paddingHorizontal: 17,
      paddingVertical: 11,
      shadowColor: '#C29A4E',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 4,
    },
    ctaLabel: {
      fontSize: 12.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#3A2C10',
    },
    ctaLabelDone: {
      color: colors.white,
    },
  });
}
