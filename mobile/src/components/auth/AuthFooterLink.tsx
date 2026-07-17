import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthFooterLinkProps = {
  muted: string;
  strong: string;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
};

/** Secondary CTA on the navy canvas — "New here? Create account". */
export function AuthFooterLink({
  muted,
  strong,
  onPress,
  testID,
  accessibilityLabel,
}: AuthFooterLinkProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? strong}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Text variant="label" style={styles.muted}>
        {muted}{' '}
      </Text>
      <Text variant="label" style={styles.strong}>
        {strong}
      </Text>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    link: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignSelf: 'center',
      alignItems: 'center',
      marginTop: 8,
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 22,
      backgroundColor: 'rgba(240,212,136,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(240,212,136,0.22)',
    },
    pressed: {
      opacity: 0.8,
      backgroundColor: 'rgba(240,212,136,0.12)',
    },
    muted: {
      color: AUTH_UI.onCanvasFaint,
      fontFamily: AUTH_FONTS.medium,
    },
    strong: {
      color: AUTH_UI.goldLt,
      fontFamily: AUTH_FONTS.bold,
      textDecorationLine: 'underline',
      textDecorationColor: 'rgba(233,200,104,0.4)',
    },
  });
}
