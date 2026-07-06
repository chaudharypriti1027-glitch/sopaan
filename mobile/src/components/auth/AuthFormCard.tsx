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

  return <View style={styles.card}>{children}</View>;
}

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: AUTH_UI.card,
      borderRadius: AUTH_UI.cardRadius,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 20,
      ...platformShadow({
        color: AUTH_UI.accent,
        offsetY: 14,
        opacity: 0.1,
        radius: 28,
        elevation: 4,
      }),
    },
  });
}
