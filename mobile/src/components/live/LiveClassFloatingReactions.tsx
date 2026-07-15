import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { resolveLiveReactionIcon } from '../../content/liveClassesContent';
import type { LiveReaction } from '../../realtime/events';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

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
        <FloatingReaction key={item.id} emoji={item.emoji} offsetRight={item.x} />
      ))}
    </View>
  );
}

function FloatingReaction({ emoji, offsetRight }: { emoji: string; offsetRight: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const Icon = resolveLiveReactionIcon(emoji);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -48, duration: 2200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.15, duration: 2200, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        floatingStyles.bubble,
        {
          right: offsetRight,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Icon size={22} color={LIVE.goldLt} strokeWidth={2.2} fill={LIVE.goldLt} />
    </Animated.View>
  );
}

const floatingStyles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(233,207,141,0.35)',
  },
});

function createStyles(_theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      right: 14,
      bottom: 170,
      width: 64,
      height: 300,
      zIndex: 18,
    },
  });
}
