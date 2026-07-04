import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AiAvatar } from './AiAvatar';
import { AI_UI } from './aiTheme';
import { platformShadow } from '../../utils/platformShadow';

function Dot({ delay }: { delay: number }) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(280),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, y]);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ translateY: y }] }]}
    />
  );
}

export function AiTypingIndicator() {
  return (
    <View style={styles.row}>
      <AiAvatar size={36} />
      <View style={styles.bubble}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: AI_UI.card,
    borderWidth: 1.5,
    borderColor: AI_UI.primaryLight,
    ...platformShadow({ color: '#000', offsetY: 2, opacity: 0.04, radius: 12, elevation: 2 }),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AI_UI.primaryMuted,
  },
});
