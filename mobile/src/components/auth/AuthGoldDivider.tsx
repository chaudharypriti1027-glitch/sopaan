import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AUTH_UI } from './authTheme';

type AuthGoldDividerProps = {
  compact?: boolean;
};

/** Gold line · diamond · gold line — brand signature from the Sign-in reference. */
export function AuthGoldDivider({ compact = false }: AuthGoldDividerProps) {
  const styles = useMemo(() => createStyles(compact), [compact]);

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.lineLeft} />
      <View style={styles.diamond} />
      <View style={styles.lineRight} />
    </View>
  );
}

function createStyles(compact: boolean) {
  const lineWidth = compact ? 28 : 44;
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: compact ? 10 : 18,
    },
    lineLeft: {
      width: lineWidth,
      height: StyleSheet.hairlineWidth + 0.5,
      backgroundColor: AUTH_UI.gold,
      opacity: 0.7,
    },
    lineRight: {
      width: lineWidth,
      height: StyleSheet.hairlineWidth + 0.5,
      backgroundColor: AUTH_UI.gold,
      opacity: 0.7,
    },
    diamond: {
      width: compact ? 4 : 5,
      height: compact ? 4 : 5,
      backgroundColor: AUTH_UI.gold,
      transform: [{ rotate: '45deg' }],
      shadowColor: AUTH_UI.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
    },
  });
}
