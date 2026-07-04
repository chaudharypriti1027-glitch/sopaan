import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { LiveReaction } from '../../realtime/events';
import { useTheme } from '../../theme';

type LiveClassFloatingReactionsProps = {
  reactions: LiveReaction[];
};

type FloatingItem = {
  id: string;
  emoji: string;
  x: number;
};

export function LiveClassFloatingReactions({ reactions }: LiveClassFloatingReactionsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    const latest = reactions.at(-1);
    if (!latest) {
      return;
    }

    const id = `${latest.createdAt}-${latest.userId}`;
    setItems((current) => {
      if (current.some((item) => item.id === id)) {
        return current;
      }

      return [...current.slice(-8), { id, emoji: latest.emoji, x: 12 + Math.random() * 56 }];
    });
  }, [reactions]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {items.map((item) => (
        <FloatingEmoji key={item.id} emoji={item.emoji} leftPct={item.x} />
      ))}
    </View>
  );
}

function FloatingEmoji({ emoji, leftPct }: { emoji: string; leftPct: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 900, delay: 700, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -72, duration: 900, delay: 700, useNativeDriver: true }),
      ]),
    ]).start();
  }, [opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        {
          left: `${leftPct}%`,
          opacity,
          transform: [{ translateY }, { scale }],
        },
        floatingStyles.emoji,
      ]}
    >
      <Text style={floatingStyles.glyph}>{emoji}</Text>
    </Animated.View>
  );
}

const floatingStyles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    bottom: 24,
  },
  glyph: {
    fontSize: 30,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});

function createStyles(_theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 3,
    },
  });
}
