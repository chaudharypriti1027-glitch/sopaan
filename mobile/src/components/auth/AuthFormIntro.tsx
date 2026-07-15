import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthFormIntroProps = {
  /** Optional; prefer leaving off when the hero already carries brand context. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Adds a restrained gold signature line for primary forms. */
  accent?: boolean;
  /** Lets a parent stack own the vertical rhythm. */
  compactSpacing?: boolean;
};

/** Title + subtitle block inside premium auth form cards. */
export function AuthFormIntro({
  eyebrow,
  title,
  subtitle,
  accent = false,
  compactSpacing = false,
}: AuthFormIntroProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View
      style={[
        styles.root,
        accent && styles.accent,
        compactSpacing && styles.compactSpacing,
      ]}
    >
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      marginBottom: 18,
    },
    accent: {
      borderLeftWidth: 3,
      borderLeftColor: AUTH_UI.gold,
      paddingLeft: 12,
    },
    compactSpacing: {
      marginBottom: 0,
    },
    eyebrow: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: AUTH_UI.goldDeep,
      marginBottom: 6,
    },
    title: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 20,
      fontWeight: '800',
      color: AUTH_UI.ink,
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: AUTH_UI.muted,
    },
  });
}
