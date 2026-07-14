import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type AuthFormIntroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

/** Eyebrow + title + subtitle block inside premium auth form cards. */
export function AuthFormIntro({ eyebrow, title, subtitle }: AuthFormIntroProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      marginBottom: 16,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: AUTH_UI.goldDeep,
      marginBottom: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: AUTH_UI.ink,
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: AUTH_UI.muted,
    },
  });
}
