import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AuthGoldDivider } from './AuthGoldDivider';
import { AuthLogo } from './AuthLogo';
import { AUTH_FONTS, AUTH_SPACING, AUTH_UI } from './authTheme';

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
      <AuthGoldDivider compact />
      {badge ? (
        <View style={styles.badgeWrap}>
          <Text variant="eyebrow" style={styles.badge}>
            {badge}
          </Text>
        </View>
      ) : null}
      <Text variant="h1" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      gap: AUTH_SPACING.stack,
    },
    badgeWrap: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: 'rgba(240,212,136,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(240,212,136,0.28)',
    },
    badge: {
      color: AUTH_UI.goldLt,
      textAlign: 'center',
      fontFamily: AUTH_FONTS.bold,
    },
    title: {
      color: AUTH_UI.onCanvas,
      textAlign: 'center',
      fontFamily: AUTH_FONTS.bold,
    },
    subtitle: {
      textAlign: 'center',
      maxWidth: 300,
      paddingHorizontal: 12,
      color: AUTH_UI.onCanvasMuted,
      fontFamily: AUTH_FONTS.medium,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
