import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AUTH_SPACING, AUTH_UI } from './authTheme';

type AuthDividerProps = {
  label: string;
};

export function AuthDivider({ label }: AuthDividerProps) {
  const styles = useMemo(() => createStyles(), []);

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

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: AUTH_SPACING.stack,
      marginVertical: AUTH_SPACING.stack,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: AUTH_UI.border,
    },
    label: {
      color: AUTH_UI.faint,
      textTransform: 'uppercase',
    },
  });
}
