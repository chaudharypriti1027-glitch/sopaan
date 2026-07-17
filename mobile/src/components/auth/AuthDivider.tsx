import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AUTH_SPACING, AUTH_UI } from './authTheme';

type AuthDividerProps = {
  label: string;
  /** Light hairlines + muted cream label on the navy canvas. */
  dark?: boolean;
};

export function AuthDivider({ label, dark = false }: AuthDividerProps) {
  const styles = useMemo(() => createStyles(dark), [dark]);

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text variant="eyebrow" style={styles.label}>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

function createStyles(dark: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: AUTH_SPACING.stack,
      marginVertical: AUTH_SPACING.stack,
    },
    line: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(28,36,80,0.12)',
    },
    label: {
      color: dark ? 'rgba(228,216,190,0.45)' : AUTH_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: dark ? 2 : undefined,
    },
  });
}
