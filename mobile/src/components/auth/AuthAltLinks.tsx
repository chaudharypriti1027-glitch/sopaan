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
};

/** Horizontal secondary actions — e.g. Forgot password · Email OTP. */
export function AuthAltLinks({ links }: AuthAltLinksProps) {
  const styles = useMemo(() => createStyles(), []);

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

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: -4,
      marginBottom: 12,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 99,
      backgroundColor: AUTH_UI.faint,
      marginHorizontal: 2,
    },
    pressable: {
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    pressed: {
      opacity: 0.7,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: AUTH_UI.accent,
    },
  });
}
