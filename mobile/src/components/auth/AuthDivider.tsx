import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type AuthDividerProps = {
  label: string;
};

export function AuthDivider({ label }: AuthDividerProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 18,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: AUTH_UI.border,
    },
    label: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: AUTH_UI.faint,
    },
  });
}
