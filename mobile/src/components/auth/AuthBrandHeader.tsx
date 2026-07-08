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
      {badge ? (
        <View style={styles.badgeWrap}>
          <Text style={styles.badge}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      marginBottom: 20,
    },
    hairline: {
      width: 48,
      height: 3,
      borderRadius: 99,
      backgroundColor: AUTH_UI.gold,
      opacity: 0.85,
      marginTop: 12,
      marginBottom: 10,
    },
    badgeWrap: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: AUTH_UI.goldSoft,
      marginBottom: 8,
    },
    badge: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: AUTH_UI.goldDeep,
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
