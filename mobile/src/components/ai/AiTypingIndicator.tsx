import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../Text';
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

  return <Animated.View style={[styles.dot, { transform: [{ translateY: y }] }]} />;
}

type AiTypingIndicatorProps = {
  label?: string;
};

export function AiTypingIndicator({ label }: AiTypingIndicatorProps) {
  return (
    <View style={styles.row}>
      <AiAvatar size={36} />
      <LinearGradient
        colors={[AI_UI.goldSoft, AI_UI.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bubble}
      >
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </LinearGradient>
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
    borderRadius: AI_UI.bubbleRadius,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: AI_UI.goldBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    minWidth: 120,
    ...platformShadow({ color: AI_UI.primary, offsetY: 4, opacity: 0.08, radius: 16, elevation: 3 }),
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AI_UI.gold,
    opacity: 0.75,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: AI_UI.goldDeep,
  },
});
