import { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { AI_UI } from './aiTheme';

type AiAvatarProps = {
  size?: number;
  style?: ViewStyle;
};

export function AiAvatar({ size = 36, style }: AiAvatarProps) {
  const styles = useMemo(() => createStyles(size), [size]);
  const iconSize = Math.round(size * 0.42);

  return (
    <LinearGradient
      colors={[AI_UI.primary, AI_UI.gradientEnd]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.avatar, style]}
    >
      <Sparkles size={iconSize} color="#FFFFFF" strokeWidth={2.2} />
    </LinearGradient>
  );
}

function createStyles(size: number) {
  return StyleSheet.create({
    avatar: {
      width: size,
      height: size,
      borderRadius: size * 0.22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.33,
      shadowRadius: 14,
      elevation: 4,
    },
  });
}
