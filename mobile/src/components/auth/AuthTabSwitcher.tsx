import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type AuthTabSwitcherProps<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
};

export function AuthTabSwitcher<T extends string>({
  options,
  value,
  onChange,
}: AuthTabSwitcherProps<T>) {
  const styles = useMemo(() => createStyles(), []);
  const [width, setWidth] = useState(0);
  const pillX = useSharedValue(0);

  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.key === value),
  );

  useEffect(() => {
    if (width <= 0) return;
    const segment = (width - 8) / options.length;
    pillX.value = withTiming(4 + activeIndex * segment, { duration: 280 });
  }, [activeIndex, options.length, pillX, width]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: width > 0 ? (width - 8) / options.length : 0,
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Animated.View style={[styles.pill, pillStyle]} />
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.key)}
            style={styles.tab}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      backgroundColor: '#F1F5F9',
      borderRadius: 16,
      padding: 4,
      marginBottom: 20,
      position: 'relative',
    },
    pill: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      borderRadius: 12,
      backgroundColor: AUTH_UI.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      zIndex: 1,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: AUTH_UI.faint,
    },
    tabTextActive: {
      color: AUTH_UI.ink,
      fontWeight: '700',
    },
  });
}
