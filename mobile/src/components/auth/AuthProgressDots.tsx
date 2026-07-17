import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AUTH_UI } from './authTheme';

type AuthProgressDotsProps = {
  total: number;
  current: number;
};

export function AuthProgressDots({ total, current }: AuthProgressDotsProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total - 1, now: current }}
    >
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[styles.dot, index <= current ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    dot: {
      height: 8,
      borderRadius: 999,
    },
    dotActive: {
      width: 28,
      backgroundColor: AUTH_UI.gold,
    },
    dotInactive: {
      width: 8,
      backgroundColor: 'rgba(240,212,136,0.22)',
    },
  });
}
