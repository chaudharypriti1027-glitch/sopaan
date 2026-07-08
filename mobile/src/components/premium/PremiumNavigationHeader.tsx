import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { PREMIUM } from './premiumStyles';

/** Navy gradient background for React Navigation stack headers. */
export function PremiumNavigationHeaderBackground() {
  const styles = useMemo(() => createStyles(), []);

  return (
    <LinearGradient
      colors={[...PREMIUM.headerGradient]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.glowA} pointerEvents="none" />
      <View style={styles.glowB} pointerEvents="none" />
    </LinearGradient>
  );
}

/** Shared premium stack header chrome — gradient bar, white title, gold back affordance. */
export function premiumStackScreenOptions(): NativeStackNavigationOptions {
  return {
    headerBackground: () => <PremiumNavigationHeaderBackground />,
    headerTitleStyle: {
      fontWeight: '800',
      fontSize: 17,
      color: '#FFFFFF',
    },
    headerTintColor: '#F4EBD8',
    headerShadowVisible: false,
    headerStyle: { backgroundColor: 'transparent' },
    contentStyle: { backgroundColor: PREMIUM.bg },
  };
}

function createStyles() {
  return StyleSheet.create({
    gradient: {
      flex: 1,
      overflow: 'hidden',
    },
    glowA: {
      position: 'absolute',
      top: -48,
      right: -36,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(194,154,78,0.2)',
    },
    glowB: {
      position: 'absolute',
      bottom: -32,
      left: -24,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
  });
}
