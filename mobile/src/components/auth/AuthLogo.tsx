import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AUTH_UI } from './authTheme';

export function AuthLogo() {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#2E3766', '#1A1F3B']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.logo}
      >
        <View style={styles.sheen} />
        <View style={styles.bars}>
          <View style={[styles.bar, styles.barShort, { backgroundColor: '#E9D19A' }]} />
          <View style={[styles.bar, styles.barMid, { backgroundColor: '#D8B368' }]} />
          <View style={[styles.bar, styles.barTall, { backgroundColor: AUTH_UI.gold }]} />
        </View>
      </LinearGradient>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
    },
    logo: {
      width: 70,
      height: 70,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      shadowColor: AUTH_UI.accent,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.4,
      shadowRadius: 22,
      elevation: 8,
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '55%',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      height: 26,
    },
    bar: {
      width: 7,
      borderRadius: 2.5,
    },
    barShort: { height: 12 },
    barMid: { height: 19 },
    barTall: { height: 26 },
  });
}
