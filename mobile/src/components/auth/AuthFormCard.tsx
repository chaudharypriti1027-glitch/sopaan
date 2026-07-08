import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AUTH_UI } from './authTheme';
import { platformShadow } from '../../utils/platformShadow';

type AuthFormCardProps = {
  children: ReactNode;
};

/** Elevated white form panel — matches the Classic Premium login mockup. */
export function AuthFormCard({ children }: AuthFormCardProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.card}>
      <View style={styles.accentLine} />
      {children}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: AUTH_UI.card,
      borderRadius: AUTH_UI.cardRadius,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 20,
      overflow: 'hidden',
      ...platformShadow({
        color: AUTH_UI.accent,
        offsetY: 10,
        opacity: 0.1,
        radius: 24,
        elevation: 4,
      }),
    },
    accentLine: {
      position: 'absolute',
      top: 0,
      left: '22%',
      right: '22%',
      height: 2,
      borderRadius: 1,
      backgroundColor: AUTH_UI.gold,
      opacity: 0.7,
    },
  });
}
