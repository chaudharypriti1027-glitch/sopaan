import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type AuthAltLink = {
  label: string;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
};

type AuthAltLinksProps = {
  links: AuthAltLink[];
  /** Centered gold links on the navy canvas — Sign-in Flow footer. */
  dark?: boolean;
};

/** Horizontal secondary actions — e.g. Forgot password · Email OTP. */
export function AuthAltLinks({ links, dark = false }: AuthAltLinksProps) {
  const styles = useMemo(() => createStyles(dark), [dark]);

  return (
    <View style={styles.row}>
      {links.map((link, index) => (
        <View key={link.testID ?? link.label} style={styles.item}>
          {index > 0 ? <View style={styles.dot} /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={link.accessibilityLabel ?? link.label}
            testID={link.testID}
            onPress={link.onPress}
            style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
          >
            <Text style={styles.label}>{link.label}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function createStyles(dark: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: dark ? 'center' : 'flex-end',
      gap: dark ? 8 : 4,
      marginTop: dark ? 0 : -4,
      marginBottom: dark ? 0 : 12,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: dark ? 8 : 4,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 99,
      backgroundColor: dark ? 'rgba(228,216,190,0.35)' : AUTH_UI.faint,
      marginHorizontal: 2,
    },
    pressable: {
      minHeight: dark ? 44 : 32,
      justifyContent: 'center',
      paddingHorizontal: dark ? 4 : 2,
    },
    pressed: {
      opacity: 0.7,
    },
    label: {
      fontSize: dark ? 14 : 12,
      fontWeight: dark ? '600' : '700',
      color: dark ? AUTH_UI.focus : AUTH_UI.goldDeep,
    },
  });
}
