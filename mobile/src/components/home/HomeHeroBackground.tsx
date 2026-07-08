import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Premium hero backdrop — navy gradient with a soft gold wash (no mesh clutter). */
export function HomeHeroBackground() {
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={['#2E3766', '#272F58', '#232A4D', '#1A1F3B']}
        locations={[0, 0.4, 0.72, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(194,154,78,0.1)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.5 }}
        style={styles.goldSheen}
      />

      <LinearGradient
        colors={['transparent', 'rgba(26,31,59,0.45)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomVignette}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  goldSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
});
