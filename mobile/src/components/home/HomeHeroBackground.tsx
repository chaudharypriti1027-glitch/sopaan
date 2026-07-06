import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const VERTICAL_LINES = [28, 76, 124, 172, 220, 268, 316, 364];

/** Premium hero backdrop — structured navy gradient + line mesh, no round orbs. */
export function HomeHeroBackground() {
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={['#2E3766', '#272F58', '#232A4D', '#1E2548', '#1A1F3B']}
        locations={[0, 0.28, 0.55, 0.78, 1]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(194,154,78,0.14)', 'rgba(194,154,78,0.03)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.65, y: 0.55 }}
        style={styles.goldSheen}
      />

      <View style={styles.mesh}>
        {HORIZONTAL_LINES.map((top) => (
          <View key={`h-${top}`} style={[styles.hLine, { top }]} />
        ))}
        {VERTICAL_LINES.map((left) => (
          <View key={`v-${left}`} style={[styles.vLine, { left }]} />
        ))}
      </View>

      <View style={styles.topRule} />
      <View style={styles.leftAccent} />
      <View style={styles.cornerBracket} />
      <LinearGradient
        colors={['transparent', 'rgba(26,31,59,0.55)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomVignette}
      />
    </View>
  );
}

const HORIZONTAL_LINES = [48, 96, 144, 192, 240, 288, 336];

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
    height: '42%',
  },
  mesh: {
    ...StyleSheet.absoluteFillObject,
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  topRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(194,154,78,0.5)',
  },
  leftAccent: {
    position: 'absolute',
    top: 20,
    left: 0,
    width: 3,
    height: 88,
    backgroundColor: 'rgba(194,154,78,0.32)',
  },
  cornerBracket: {
    position: 'absolute',
    top: 16,
    right: 18,
    width: 24,
    height: 24,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
});
