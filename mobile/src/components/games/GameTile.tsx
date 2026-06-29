import { LinearGradient } from 'expo-linear-gradient';
import {
  Calculator,
  Clock,
  Code,
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
  Plus,
  Puzzle,
  SpellCheck2,
  Zap,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import type { GameCatalogItem } from '../../games/types';

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
};

export function GameTile({ game, onPress, featured = false }: GameTileProps) {
  const styles = useMemo(() => createStyles(featured), [featured]);
  const Icon = ICONS[game.icon];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={game.title}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[...game.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.decorA} />
        <View style={styles.decorB} />

        <View style={[styles.iconBox, featured && styles.iconBoxFeatured]}>
          <Icon size={featured ? 28 : 22} color="#FFFFFF" strokeWidth={2} />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{game.title}</Text>
          <Text style={styles.desc}>{game.description}</Text>
          {featured ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
          ) : null}
        </View>

        {!featured ? (
          <View style={styles.footer}>
            <View style={styles.coins}>
              <Text style={styles.coinsText}>🪙 +{game.coinReward}</Text>
            </View>
            {game.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{game.badge}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.resume}>
            <Text style={styles.resumeText}>Play</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(featured: boolean) {
  return StyleSheet.create({
    wrap: {
      width: featured ? '100%' : '48%',
      borderRadius: 22,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 4,
    },
    pressed: {
      opacity: 0.94,
      transform: [{ scale: 0.98 }],
    },
    card: {
      minHeight: featured ? 88 : 142,
      padding: featured ? 16 : 18,
      borderRadius: 22,
      overflow: 'hidden',
      flexDirection: featured ? 'row' : 'column',
      alignItems: featured ? 'center' : 'stretch',
      gap: featured ? 16 : 0,
      justifyContent: 'space-between',
    },
    decorA: {
      position: 'absolute',
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'rgba(255,255,255,0.1)',
      right: -35,
      top: -35,
    },
    decorB: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.06)',
      right: 20,
      bottom: -30,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    iconBoxFeatured: {
      width: 54,
      height: 54,
      flexShrink: 0,
    },
    body: {
      flex: featured ? 1 : undefined,
      zIndex: 1,
      marginTop: featured ? 0 : 10,
    },
    name: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    desc: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 3,
    },
    progressTrack: {
      height: 5,
      borderRadius: 5,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginTop: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      zIndex: 1,
    },
    coins: {
      backgroundColor: 'rgba(0,0,0,0.18)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    coinsText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    badge: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    resume: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      zIndex: 1,
      flexShrink: 0,
    },
    resumeText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}
