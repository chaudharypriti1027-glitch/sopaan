import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import { platformShadow } from '../../utils/platformShadow';
import { HOME_UI, homePressFeedback } from './homeTheme';

type HomePlayChipProps = {
  onPress?: () => void;
  size?: 'sm' | 'md';
};

/** Navy 3D play chip — continue-learning cards and similar CTAs. */
export function HomePlayChip({ onPress, size = 'md' }: HomePlayChipProps) {
  const styles = useMemo(() => createStyles(size), [size]);
  const dim = size === 'sm' ? 40 : 44;
  const icon = size === 'sm' ? 16 : 18;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.shell, pressed && onPress && homePressFeedback]}
    >
      <LinearGradient
        colors={[...HOME_UI.accentGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, { width: dim, height: dim, borderRadius: size === 'sm' ? 12 : 14 }]}
      >
        <View style={styles.sheen} />
        <View style={styles.rim} />
        <Play size={icon} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
      </LinearGradient>
    </Pressable>
  );
}

function createStyles(size: 'sm' | 'md') {
  return StyleSheet.create({
    shell: {
      flexShrink: 0,
      ...platformShadow({
        color: HOME_UI.accent,
        offsetY: 6,
        opacity: 0.35,
        radius: 12,
        elevation: 4,
      }),
    },
    fill: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      overflow: 'hidden',
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '44%',
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    rim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
  });
}
