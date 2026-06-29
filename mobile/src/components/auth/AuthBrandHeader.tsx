import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AuthLogo } from './AuthLogo';
import { AUTH_UI } from './authTheme';

type AuthBrandHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
};

export function AuthBrandHeader({ title, subtitle, badge }: AuthBrandHeaderProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      <AuthLogo />
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      marginBottom: 24,
    },
    badge: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: AUTH_UI.accent,
      marginBottom: 4,
      textAlign: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: AUTH_UI.ink,
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: AUTH_UI.muted,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 300,
    },
  });
}
