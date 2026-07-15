import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Coins, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { HomePremiumButton } from './HomePremiumButton';
import { Text } from '../Text';
import { NumText } from '../NumText';
import type { HomeFeed } from '../../types/home';
import { HOME_UI, homePressFeedback } from './homeTheme';

type DailyChallengeCardProps = {
  challenge: HomeFeed['dailyChallenge'];
  onPress?: (deeplink: string) => void;
};

export function DailyChallengeCard({ challenge, onPress }: DailyChallengeCardProps) {
  const { t } = useTranslation(['app', 'practice']);
  const styles = useMemo(() => createStyles(), []);

  if (!challenge) {
    return null;
  }

  const done = challenge.status === 'done';
  const deeplink = `/stack/Quiz/${challenge.testId}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(deeplink)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[...HOME_UI.heroGradient]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.card}
      >
        <View style={styles.glow} pointerEvents="none" />

        <View style={styles.top}>
          <View style={styles.iconWrap}>
            <Star size={18} color={HOME_UI.goldLt} strokeWidth={2.2} fill={HOME_UI.gold} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>{t('home.dailyChallenge')}</Text>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {challenge.title || t('home.questionsToday', { count: challenge.qCount })}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <NumText style={styles.metaValue}>{challenge.qCount}</NumText>
            <Text style={styles.metaLabel} numberOfLines={1}>
              {t('practice.questions')}
            </Text>
          </View>
          <View style={[styles.metaChip, styles.metaChipGrow]}>
            <Coins size={13} color={HOME_UI.goldLt} strokeWidth={2.2} />
            <Text style={styles.metaHint} numberOfLines={1} ellipsizeMode="tail">
              {t('home.challengeEarnShort', { coins: challenge.rewardCoins })}
            </Text>
          </View>
        </View>

        <HomePremiumButton
          label={done ? t('home.challengeDoneMark') : t('home.challengeStart')}
          variant={done ? 'ghost' : 'gold'}
          size="md"
          fullWidth
          disabled={done}
          onPress={() => onPress?.(deeplink)}
        />
      </LinearGradient>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      borderRadius: HOME_UI.cardRadiusLg,
      overflow: 'hidden',
    },
    pressed: homePressFeedback,
    card: {
      borderRadius: HOME_UI.cardRadiusLg,
      padding: 16,
      gap: 14,
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: -36,
      right: -24,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(227,201,127,0.12)',
    },
    top: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(194,154,78,0.22)',
      borderWidth: 1,
      borderColor: 'rgba(227,201,127,0.28)',
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
      paddingTop: 2,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.55)',
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.2,
      lineHeight: 22,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'stretch',
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      flexShrink: 0,
    },
    metaChipGrow: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    metaValue: {
      fontSize: 13,
      fontWeight: '800',
      color: HOME_UI.goldLt,
    },
    metaLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.62)',
    },
    metaHint: {
      flex: 1,
      minWidth: 0,
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.78)',
    },
  });
}
