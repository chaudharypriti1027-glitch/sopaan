import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AuthLogo } from './AuthLogo';
import { AUTH_SPACING, AUTH_UI } from './authTheme';

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
          <Text variant="eyebrow" style={styles.badge}>
            {badge}
          </Text>
        </View>
      ) : null}
      <Text variant="h1" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      gap: AUTH_SPACING.stack,
    },
    hairline: {
      width: 40,
      height: 2,
      borderRadius: 99,
      backgroundColor: AUTH_UI.gold,
    },
    badgeWrap: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: AUTH_UI.goldSoft,
    },
    badge: {
      color: AUTH_UI.goldDeep,
      textAlign: 'center',
    },
    title: {
      color: AUTH_UI.ink,
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
      maxWidth: 300,
      paddingHorizontal: 12,
    },
  });
}
