import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SopaanLogo } from '../SopaanLogo';
import { AUTH_UI } from './authTheme';

type AuthLogoProps = {
  size?: number;
};

/** Auth brand mark — same gold “S” icon used across splash and headers. */
export function AuthLogo({ size = 70 }: AuthLogoProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <View style={styles.shadow}>
        <SopaanLogo size={size} />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
    },
    shadow: {
      shadowColor: AUTH_UI.accent,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.4,
      shadowRadius: 22,
      elevation: 8,
    },
  });
}
