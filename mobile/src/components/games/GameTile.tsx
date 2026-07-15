import { LinearGradient } from 'expo-linear-gradient';
import {
  Calculator,
  ChevronRight,
  Clock,
  Code,
  Coins,
  Crosshair,
  Flag,
  FlaskConical,
  Gamepad2,
  GitBranch,
  Globe,
  Grid3x3,
  HelpCircle,
  Link,
  Map,
  MessageSquare,
  PenLine,
  Play,
  Plus,
  Puzzle,
  SpellCheck2,
  Zap,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card } from '../Card';
import { PremiumIcon } from '../premium/PremiumIcon';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { toneForText } from '../../utils/iconTone';
import type { GameCatalogItem } from '../../games/types';
import { homePremiumCard } from '../home/homeStyles';
import { premiumTileShadow } from '../premium/premiumStyles';
import { GAMES_UI } from './gamesTheme';

const ICONS = {
  memory: Gamepad2,
  scramble: Puzzle,
  bingo: Grid3x3,
  rapid: Zap,
  crossword: Crosshair,
  map: Map,
  math: Plus,
  grammar: PenLine,
  science: FlaskConical,
  history: Clock,
  spell: SpellCheck2,
  flag: Flag,
  logic: GitBranch,
  number: Calculator,
  chain: Link,
  world: Globe,
  trivia: HelpCircle,
  code: Code,
  story: MessageSquare,
} as const;

type GameTileProps = {
  game: GameCatalogItem;
  onPress: () => void;
  featured?: boolean;
  bestScore?: number;
  playLabel?: string;
};

export function GameTile({
  game,
  onPress,
  featured = false,
  bestScore,
  playLabel = 'Play',
}: GameTileProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const Icon = ICONS[game.icon];
  const iconTone = featured ? 'gold' : toneForText(game.title);
  const progress = Math.min(100, Math.max(0, bestScore ?? 0));

  if (featured) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={game.title}
        onPress={onPress}
        style={({ pressed }) => [styles.featuredWrap, pressed && styles.pressed]}
      >
        <Card padded={false} style={styles.featuredCard}>
          <LinearGradient
            colors={['#E3C97F', '#C29A4E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.featuredAccent}
          />
          <View style={styles.featuredTop}>
            <PremiumIcon Icon={Icon} tone={iconTone} size="md" filled />
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {game.title}
              </Text>
              <Text style={styles.featuredDesc} numberOfLines={2}>
                {game.description}
              </Text>
            </View>
            <LinearGradient
              colors={['#2E3766', '#232A4D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playChip}
            >
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
              <Text style={styles.playChipText}>{playLabel}</Text>
            </LinearGradient>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#E3C97F', '#C29A4E']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          {bestScore != null && bestScore > 0 ? (
            <Text style={styles.bestFeatured}>Best {bestScore}</Text>
          ) : null}
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={game.title}
      onPress={onPress}
      style={({ pressed }) => [styles.gridWrap, pressed && styles.pressed]}
    >
      <View style={styles.gridCard}>
        <View style={styles.gridTop}>
          <PremiumIcon Icon={Icon} tone={iconTone} size="sm" filled />
          {game.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{game.badge}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.gridTitle} numberOfLines={2}>
          {game.title}
        </Text>
        <Text style={styles.gridDesc} numberOfLines={2}>
          {game.description}
        </Text>

        <View style={styles.gridFooter}>
          <View style={styles.coins}>
            <Coins size={12} color={GAMES_UI.gold} strokeWidth={2.2} />
            <Text style={styles.coinsText}>+{game.coinReward}</Text>
          </View>
          <View style={styles.footerEnd}>
            {bestScore != null && bestScore > 0 ? (
              <Text style={styles.bestMini}>★ {bestScore}</Text>
            ) : null}
            <ChevronRight size={14} color={GAMES_UI.muted} strokeWidth={2.2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const cardBase = homePremiumCard(theme);

  return StyleSheet.create({
    featuredWrap: {
      width: '100%',
    },
    gridWrap: {
      width: '100%',
    },
    pressed: {
      opacity: 0.94,
      transform: [{ scale: 0.98 }],
    },
    featuredCard: {
      ...cardBase,
      padding: 16,
      gap: 10,
      overflow: 'hidden',
    },
    featuredAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: 22,
      borderBottomLeftRadius: 22,
    },
    featuredTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featuredCopy: {
      flex: 1,
      minWidth: 0,
    },
    featuredTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: GAMES_UI.ink,
      letterSpacing: -0.2,
    },
    featuredDesc: {
      fontSize: 11,
      color: GAMES_UI.muted,
      marginTop: 3,
      lineHeight: 15,
    },
    playChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexShrink: 0,
    },
    playChipText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    progressTrack: {
      height: 7,
      borderRadius: 99,
      backgroundColor: theme.colors.border.subtle,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 99,
    },
    bestFeatured: {
      fontSize: 10,
      fontWeight: '700',
      color: GAMES_UI.goldDeep,
    },
    gridCard: {
      ...cardBase,
      minHeight: 148,
      padding: 14,
      justifyContent: 'space-between',
      ...premiumTileShadow(theme),
    },
    gridTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    gridTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: GAMES_UI.ink,
      letterSpacing: -0.2,
    },
    gridDesc: {
      fontSize: 10,
      color: GAMES_UI.muted,
      marginTop: 3,
      lineHeight: 14,
      flex: 1,
    },
    gridFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    footerEnd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    coins: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: GAMES_UI.goldSoft,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: '#EADFC4',
    },
    coinsText: {
      fontSize: 11,
      fontWeight: '800',
      color: GAMES_UI.goldDeep,
    },
    bestMini: {
      fontSize: 11,
      fontWeight: '800',
      color: GAMES_UI.sage,
    },
    badge: {
      backgroundColor: GAMES_UI.accentSoft,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: GAMES_UI.accent,
      textTransform: 'uppercase',
    },
  });
}
