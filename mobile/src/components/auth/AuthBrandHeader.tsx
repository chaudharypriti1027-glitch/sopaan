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
      <View style={styles.hairline} />
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
      marginBottom: 22,
    },
    hairline: {
      width: 48,
      height: 3,
      borderRadius: 99,
      backgroundColor: AUTH_UI.gold,
      opacity: 0.85,
      marginTop: 14,
      marginBottom: 12,
    },
    badge: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: AUTH_UI.goldDeep,
      marginBottom: 6,
      textAlign: 'center',
    },
    title: {
      fontSize: 25,
      fontWeight: '800',
      color: AUTH_UI.ink,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 13,
      color: AUTH_UI.muted,
      fontWeight: '600',
      lineHeight: 19,
      textAlign: 'center',
      maxWidth: 300,
    },
  });
}
