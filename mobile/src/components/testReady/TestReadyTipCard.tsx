import { Zap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Text } from '../Text';
import { resultCard, RESULT_UI } from '../result/resultTheme';

type TestReadyTipCardProps = {
  title: string;
  tips: string[];
  delay?: number;
};

export function TestReadyTipCard({ title, tips, delay = 460 }: TestReadyTipCardProps) {
  const [index, setIndex] = useState(0);
  const styles = useMemo(() => createStyles(), []);

  useEffect(() => {
    if (tips.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % tips.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [tips.length]);

  return (
    <Animated.View entering={FadeInDown.duration(440).delay(delay)} style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Zap size={16} color={RESULT_UI.goldDeep} strokeWidth={2.4} fill={RESULT_UI.goldLt} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.tipBody}>
          <Animated.View
            key={`tip-${index}`}
            entering={FadeIn.duration(360)}
            exiting={FadeOut.duration(220)}
          >
            <Text style={styles.body}>{tips[index]}</Text>
          </Animated.View>
        </View>

        {tips.length > 1 ? (
          <View style={styles.dots}>
            {tips.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      overflow: 'hidden',
      ...resultCard({ backgroundColor: RESULT_UI.goldSoft }),
    },
    accent: {
      width: 5,
      backgroundColor: RESULT_UI.gold,
    },
    inner: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 10,
      minHeight: 118,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.72)',
      borderWidth: 1,
      borderColor: RESULT_UI.goldBorder,
    },
    title: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: RESULT_UI.goldDeep,
    },
    tipBody: {
      minHeight: 44,
      justifyContent: 'center',
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      fontWeight: '600',
      color: RESULT_UI.ink,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(194,154,78,0.28)',
    },
    dotActive: {
      width: 18,
      backgroundColor: RESULT_UI.gold,
    },
  });
}
