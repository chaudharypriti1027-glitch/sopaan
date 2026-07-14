import { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { AI_UI } from './aiTheme';

type AiAvatarProps = {
  size?: number;
  style?: ViewStyle;
  variant?: 'default' | 'hero';
};

export function AiAvatar({ size = 36, style, variant = 'default' }: AiAvatarProps) {
  const styles = useMemo(() => createStyles(size, variant), [size, variant]);
  const iconSize = Math.round(size * (variant === 'hero' ? 0.4 : 0.42));

  return (
    <LinearGradient
      colors={[AI_UI.gold, AI_UI.goldDeep]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.ring, style]}
    >
      <LinearGradient
        colors={[AI_UI.primary, AI_UI.gradientEnd]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.avatar}
      >
        <Sparkles size={iconSize} color="#FFFFFF" strokeWidth={2.2} />
      </LinearGradient>
    </LinearGradient>
  );
}

function createStyles(size: number, variant: 'default' | 'hero') {
  const ring = variant === 'hero' ? 2.5 : 2;
  return StyleSheet.create({
    ring: {
      width: size + ring * 2,
      height: size + ring * 2,
      borderRadius: (size + ring * 2) * 0.24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: variant === 'hero' ? 0.35 : 0.28,
      shadowRadius: 16,
      elevation: 5,
    },
    avatar: {
      width: size,
      height: size,
      borderRadius: size * 0.22,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
