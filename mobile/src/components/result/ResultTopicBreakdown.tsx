import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import {
  resultCard,
  RESULT_UI,
  TOPIC_BAR_GRADIENT,
  topicBarVariant,
  topicPctColor,
} from './resultTheme';

type TopicStat = {
  topic: string;
  pct: number;
};

type ResultTopicBreakdownProps = {
  items: TopicStat[];
};

export function ResultTopicBreakdown({ items }: ResultTopicBreakdownProps) {
  const styles = useMemo(() => createStyles(), []);

  if (!items.length) return null;

  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={item.topic} style={[styles.row, index > 0 && styles.rowBorder]}>
          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>
              {item.topic}
            </Text>
            <NumText style={[styles.pct, { color: topicPctColor(item.pct) }]}>{item.pct}%</NumText>
          </View>
          <TopicBar pct={item.pct} delay={index * 100} />
        </View>
      ))}
    </View>
  );
}

function TopicBar({ pct, delay }: { pct: number; delay: number }) {
  const progress = useSharedValue(0);
  const variant = topicBarVariant(pct);
  const colors = TOPIC_BAR_GRADIENT[variant];
  const barStyles = useMemo(() => barStyleSheet, []);

  useEffect(() => {
    progress.value = withDelay(delay + 300, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(pct * progress.value, 0)}%`,
  }));

  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, fillStyle]}>
        <LinearGradient colors={[...colors]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={barStyles.gradient} />
      </Animated.View>
    </View>
  );
}

const barStyleSheet = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 99,
    backgroundColor: RESULT_UI.hair,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    minWidth: 0,
    borderRadius: 99,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    height: '100%',
    borderRadius: 99,
  },
});

function createStyles() {
  return StyleSheet.create({
    card: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      ...resultCard(),
    },
    row: {
      paddingVertical: 13,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: RESULT_UI.hair,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 8,
    },
    name: {
      flex: 1,
      fontSize: 13,
      fontWeight: '800',
      color: RESULT_UI.ink,
    },
    pct: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
