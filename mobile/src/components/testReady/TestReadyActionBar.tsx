import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { platformShadow } from '../../utils/platformShadow';
import { RESULT_UI } from '../result/resultTheme';
import { PRACTICE_UI } from '../practice/practiceTheme';

type TestReadyActionBarProps = {
  startLabel: string;
  laterLabel: string;
  onStart: () => void;
  onLater: () => void;
};

export function TestReadyActionBar({
  startLabel,
  laterLabel,
  onStart,
  onLater,
}: TestReadyActionBarProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);

  return (
    <Animated.View entering={FadeInUp.duration(420).delay(520)} style={styles.wrap}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={({ pressed }) => [pressed && styles.pressed]}
          testID="test-ready-start"
        >
          <LinearGradient
            colors={['#F0D48A', '#C29A4E', '#A67C33']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryText}>{startLabel}</Text>
            <ArrowRight size={18} color="#2a2110" strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onLater}
          style={({ pressed }) => [styles.laterBtn, pressed && styles.pressed]}
        >
          <Text style={styles.laterText}>{laterLabel}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function createStyles(bottomInset: number) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: bottomInset + 12,
      paddingTop: 12,
      paddingHorizontal: 20,
      backgroundColor: 'rgba(244,241,233,0.96)',
      borderTopWidth: 1,
      borderTopColor: RESULT_UI.line,
      ...platformShadow({
        color: RESULT_UI.navy,
        offsetY: -8,
        opacity: 0.08,
        radius: 18,
        elevation: 8,
      }),
    },
    bar: {
      gap: 8,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 17,
      borderRadius: 18,
      ...platformShadow({
        color: RESULT_UI.goldDeep,
        offsetY: 10,
        opacity: 0.35,
        radius: 16,
        elevation: 4,
      }),
    },
    primaryText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#2a2110',
      letterSpacing: 0.2,
    },
    laterBtn: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    laterText: {
      fontSize: 14,
      fontWeight: '700',
      color: PRACTICE_UI.muted,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
  });
}
