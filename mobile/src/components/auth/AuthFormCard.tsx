import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AUTH_UI } from './authTheme';
import { platformShadow } from '../../utils/platformShadow';

type AuthFormCardProps = {
  children: ReactNode;
  overlap?: boolean;
  /** Stronger elevation for login / primary auth forms. */
  premium?: boolean;
  /** Removes the outline while retaining the form surface. */
  borderless?: boolean;
};

/** Elevated cream form panel resting on the dark navy auth canvas. */
export function AuthFormCard({ children, overlap, premium, borderless }: AuthFormCardProps) {
  const styles = useMemo(
    () => createStyles(overlap, premium, borderless),
    [borderless, overlap, premium],
  );

  return (
    <View style={styles.card}>
      <View style={styles.accentLine} />
      {premium ? <View style={styles.sheen} pointerEvents="none" /> : null}
      {children}
    </View>
  );
}

function createStyles(overlap?: boolean, premium?: boolean, borderless?: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: AUTH_UI.card,
      borderRadius: AUTH_UI.cardRadius,
      borderWidth: borderless ? 0 : 1,
      borderColor: premium ? 'rgba(201,162,75,0.28)' : 'rgba(255,255,255,0.08)',
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 18,
      overflow: 'hidden',
      zIndex: 3,
      ...(overlap ? { marginTop: 8 } : null),
      ...platformShadow({
        color: '#000000',
        offsetY: premium ? 20 : 16,
        opacity: premium ? 0.42 : 0.34,
        radius: premium ? 36 : 28,
        elevation: premium ? 10 : 8,
      }),
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      backgroundColor: 'rgba(201,162,75,0.05)',
    },
    accentLine: {
      position: 'absolute',
      top: 0,
      left: '22%',
      right: '22%',
      height: 2,
      borderRadius: 1,
      backgroundColor: AUTH_UI.gold,
      opacity: 0.75,
    },
  });
}
