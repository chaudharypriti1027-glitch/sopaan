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

      return [...current.slice(-8), { id, emoji: latest.emoji, x: Math.random() * 30 }];
    });
  }, [reactions]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {items.map((item) => (
        <FloatingEmoji key={item.id} emoji={item.emoji} offsetRight={item.x} />
      ))}
    </View>
  );
}

function FloatingEmoji({ emoji, offsetRight }: { emoji: string; offsetRight: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -40, duration: 2200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.2, duration: 2200, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        floatingStyles.emoji,
        {
          right: offsetRight,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={floatingStyles.glyph}>{emoji}</Text>
    </Animated.View>
  );
}

const floatingStyles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    bottom: 0,
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
      position: 'absolute',
      right: 14,
      bottom: 170,
      width: 60,
      height: 300,
      zIndex: 18,
    },
  });
}
