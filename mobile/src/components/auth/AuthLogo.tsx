import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AUTH_UI } from './authTheme';

const APP_ICON = require('../../../assets/icon.png');

export function AuthLogo() {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <View style={styles.shadow}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="Sopaan"
          source={APP_ICON}
          style={styles.logo}
        />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      marginBottom: 20,
    },
    shadow: {
      shadowColor: AUTH_UI.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 6,
      borderRadius: 16,
    },
    logo: {
      width: 56,
      height: 56,
      borderRadius: 16,
    },
  });
}
