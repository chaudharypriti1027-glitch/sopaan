import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AUTH_UI } from './authTheme';
import { platformShadow } from '../../utils/platformShadow';

type AuthFormCardProps = {
  children: ReactNode;
  overlap?: boolean;
  /** Stronger elevation for login / primary auth forms. */
  premium?: boolean;
};

/** Elevated white form panel — matches the Classic Premium login mockup. */
export function AuthFormCard({ children, overlap, premium }: AuthFormCardProps) {
  const styles = useMemo(() => createStyles(overlap, premium), [overlap, premium]);

  return (
    <View style={styles.card}>
      <View style={styles.accentLine} />
      {premium ? <View style={styles.sheen} pointerEvents="none" /> : null}
      {children}
    </View>
  );
}

function createStyles(overlap?: boolean, premium?: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: AUTH_UI.card,
      borderRadius: AUTH_UI.cardRadius,
      borderWidth: 1,
      borderColor: premium ? 'rgba(194,154,78,0.22)' : AUTH_UI.border,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 18,
      overflow: 'hidden',
      zIndex: 3,
      ...(overlap ? { marginTop: 0 } : null),
      ...platformShadow({
        color: AUTH_UI.accent,
        offsetY: premium ? 18 : 14,
        opacity: premium ? 0.18 : 0.14,
        radius: premium ? 36 : 32,
        elevation: premium ? 8 : 6,
      }),
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      backgroundColor: 'rgba(194,154,78,0.04)',
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
