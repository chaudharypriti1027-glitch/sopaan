import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOME_UI } from './homeTheme';

/** Navy header atmosphere — gold wash + soft rings to match Home HTML. */
export function HomeHeroBackground() {
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={[...HOME_UI.heroGradient]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbGold} />
      <View style={styles.orbRing} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orbGold: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(201,162,75,0.28)',
    opacity: 0.85,
  },
  orbRing: {
    position: 'absolute',
    bottom: -120,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
