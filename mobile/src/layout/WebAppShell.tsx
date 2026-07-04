import { useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type WebAppShellProps = {
  children: ReactNode;
};

/** Full-width web canvas — student app, not a phone simulator. */
export function WebAppShell({ children }: WebAppShellProps) {
  const styles = useMemo(() => createStyles(), []);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return <View style={styles.canvas}>{children}</View>;
}

function createStyles() {
  return StyleSheet.create({
    canvas: {
      flex: 1,
      width: '100%',
      backgroundColor: '#F4F1E9',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      minHeight: '100vh' as any,
    },
  });
}
