import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';
import { platformShadow } from '../../utils/platformShadow';

type AuthFooterLinkProps = {
  muted: string;
  strong: string;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
};

/** Pill-shaped secondary CTA — "New here? Create account" / "Already have an account? Log in". */
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
      <Text style={styles.muted}>{muted} </Text>
      <Text style={styles.strong}>{strong}</Text>
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
      marginTop: 4,
      minHeight: 46,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 23,
      backgroundColor: AUTH_UI.card,
      borderWidth: 1.5,
      borderColor: AUTH_UI.borderHover,
      ...platformShadow({
        color: AUTH_UI.shadowSm,
        offsetY: 6,
        opacity: 0.06,
        radius: 14,
        elevation: 2,
      }),
    },
    pressed: {
      opacity: 0.75,
      backgroundColor: AUTH_UI.bg,
    },
    muted: {
      fontSize: 13,
      color: AUTH_UI.label,
      fontWeight: '600',
    },
    strong: {
      fontSize: 13,
      fontWeight: '800',
      color: AUTH_UI.accent,
      textDecorationLine: 'underline',
    },
  });
}
