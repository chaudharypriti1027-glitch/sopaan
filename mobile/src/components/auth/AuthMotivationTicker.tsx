import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import {
  AUTH_MOTIVATION_COUNT,
  nextMotivationIndex,
  pickMotivationIndex,
} from '../../content/authMotivationContent';
import { Text } from '../Text';
import { AUTH_FONTS } from './authTheme';

const ROTATE_MS = 4200;

type AuthMotivationTickerProps = {
  title: string;
  lines: string[];
  seed: string;
  testID?: string;
  tone?: 'hero' | 'splash';
};

export function AuthMotivationTicker({
  title,
  lines,
  seed,
  testID,
  tone = 'hero',
}: AuthMotivationTickerProps) {
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(tone), [tone]);
  const [index, setIndex] = useState(() => pickMotivationIndex(seed));

  const activeLines = lines.length > 0 ? lines : [''];
  const activeIndex = index % activeLines.length;

  useEffect(() => {
    if (reducedMotion || activeLines.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setIndex((value) => nextMotivationIndex(value % AUTH_MOTIVATION_COUNT));
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [activeLines.length, reducedMotion]);

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Flame size={12} color="#E3C97F" fill="#E3C97F" />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.body}>
        <Animated.View
          key={`motivation-${activeIndex}`}
          entering={FadeIn.duration(reducedMotion ? 0 : 380)}
          exiting={FadeOut.duration(reducedMotion ? 0 : 220)}
        >
          <Text style={styles.line}>{activeLines[activeIndex]}</Text>
        </Animated.View>
      </View>

      {activeLines.length > 1 ? (
        <View style={styles.dots}>
          {activeLines.map((_, dotIndex) => (
            <View key={dotIndex} style={[styles.dot, dotIndex === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(tone: 'hero' | 'splash') {
  const isSplash = tone === 'splash';

  return StyleSheet.create({
    wrap: {
      width: '100%',
      maxWidth: isSplash ? 320 : undefined,
      marginTop: isSplash ? 8 : 2,
      paddingTop: isSplash ? 0 : 12,
      paddingHorizontal: 4,
      gap: 8,
      borderTopWidth: isSplash ? 0 : 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    iconWrap: {
      width: 22,
      height: 22,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    title: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.82)',
    },
    body: {
      minHeight: isSplash ? 44 : 40,
      justifyContent: 'center',
      paddingHorizontal: isSplash ? 10 : 6,
    },
    line: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: isSplash ? 14 : 13,
      lineHeight: isSplash ? 21 : 19,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.92)',
      textAlign: 'center',
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    dotActive: {
      width: 16,
      backgroundColor: '#E3C97F',
    },
  });
}
