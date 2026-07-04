import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { Button } from '../Button';
import { GlassSurface } from '../GlassSurface';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { premiumGlowShadow } from '../premium/premiumStyles';
import { GAMES_UI } from './gamesTheme';

type GameResultCardProps = {
  title: string;
  subtitle: string;
  score: number;
  scoreLabel: string;
  coinsLabel: string;
  coinsValue: string | number;
  xpLabel?: string;
  xpValue?: number;
  coinsLoading?: boolean;
  rewardHint?: string;
  playAgainLabel: string;
  allGamesLabel: string;
  retryLabel?: string;
  showRetry?: boolean;
  retryLoading?: boolean;
  onPlayAgain: () => void;
  onAllGames: () => void;
  onRetry?: () => void;
};

export function GameResultCard({
  title,
  subtitle,
  score,
  scoreLabel,
  coinsLabel,
  coinsValue,
  xpLabel,
  xpValue,
  coinsLoading,
  rewardHint,
  playAgainLabel,
  allGamesLabel,
  retryLabel,
  showRetry,
  retryLoading,
  onPlayAgain,
  onAllGames,
  onRetry,
}: GameResultCardProps) {
  const styles = useMemo(() => createStyles(), []);

  const stats = [
    { label: scoreLabel, value: String(score), gold: false },
    {
      label: coinsLabel,
      value: coinsLoading ? '…' : `+${coinsValue}`,
      gold: true,
    },
    ...(xpLabel && xpValue != null
      ? [{ label: xpLabel, value: `+${xpValue}`, gold: false }]
      : []),
  ];

  return (
    <Animated.View
      entering={ZoomIn.duration(420).reduceMotion(ReduceMotion.System)}
      style={styles.outer}
    >
      <GlassSurface tone="gold" intensity={32} borderRadius={24} style={styles.glassWrap}>
        <LinearGradient
          colors={[...GAMES_UI.heroGradient]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.heroBand}
        >
          <View style={[styles.blob, styles.blobA]} />
          <LinearGradient
            colors={['#E3C97F', '#C29A4E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trophy}
          >
            <Trophy size={30} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
          </LinearGradient>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.statsRow}>
            {stats.flatMap((stat, index) => [
              index > 0 ? <View key={`${stat.label}-div`} style={styles.divider} /> : null,
              <View key={stat.label} style={styles.stat}>
                <NumText style={[styles.statVal, stat.gold && styles.statGold]}>{stat.value}</NumText>
                <Text style={styles.statLbl}>{stat.label}</Text>
              </View>,
            ])}
          </View>

          {rewardHint ? <Text style={styles.hint}>{rewardHint}</Text> : null}

          <View style={styles.actions}>
            {showRetry && onRetry && retryLabel ? (
              <Button label={retryLabel} onPress={onRetry} loading={retryLoading} fullWidth />
            ) : null}
            <Button label={playAgainLabel} onPress={onPlayAgain} fullWidth />
            <Button label={allGamesLabel} variant="ghost" onPress={onAllGames} fullWidth />
          </View>
        </View>
      </GlassSurface>
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    outer: {
      borderRadius: 24,
      ...premiumGlowShadow(GAMES_UI.gold),
    },
    glassWrap: {
      overflow: 'hidden',
      borderRadius: 24,
    },
    heroBand: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 28,
      paddingBottom: 36,
      overflow: 'hidden',
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: 'rgba(194,154,78,0.22)',
    },
    blobA: { top: -40, right: -30, width: 140, height: 140 },
    trophy: {
      width: 68,
      height: 68,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      ...premiumGlowShadow(GAMES_UI.gold),
    },
    body: {
      backgroundColor: GAMES_UI.surface,
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 22,
      gap: 10,
      marginTop: -18,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: GAMES_UI.ink,
      letterSpacing: -0.4,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: GAMES_UI.muted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 4,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: GAMES_UI.goldSoft,
      borderWidth: 1,
      borderColor: '#EADFC4',
      borderRadius: 18,
      paddingVertical: 14,
      marginVertical: 4,
    },
    statCell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: 'rgba(194,154,78,0.35)',
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    statVal: {
      fontSize: 20,
      fontWeight: '900',
      color: GAMES_UI.ink,
    },
    statGold: {
      color: GAMES_UI.goldDeep,
    },
    statLbl: {
      fontSize: 10,
      color: GAMES_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    hint: {
      fontSize: 12,
      color: GAMES_UI.muted,
      textAlign: 'center',
    },
    actions: {
      gap: 10,
      marginTop: 4,
      width: '100%',
    },
  });
}
