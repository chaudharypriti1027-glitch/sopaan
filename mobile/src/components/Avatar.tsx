import { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ImageSourcePropType, type ImageStyle, type ViewStyle } from 'react-native';
import { OptimizedImage } from './OptimizedImage';
import { useTheme } from '../theme';

type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  name?: string;
  source?: ImageSourcePropType;
  size?: AvatarSize;
  style?: ViewStyle & ImageStyle;
};

const SIZE_MAP = { sm: 32, md: 44, lg: 64 } as const;

export function Avatar({ name, source, size = 'md', style }: AvatarProps) {
  const { theme } = useTheme();
  const dimension = SIZE_MAP[size];
  const styles = useMemo(() => createStyles(theme, dimension), [theme, dimension]);
  const initials = getInitials(name);

  if (source) {
    const uri = typeof source === 'object' && 'uri' in source ? source.uri : undefined;

    if (uri) {
      return (
        <OptimizedImage
          uri={uri}
          style={[styles.avatar, style]}
          accessibilityLabel={name}
        />
      );
    }

    return null;
  }

  return (
    <LinearGradient
      colors={[theme.colors.accent.gold, theme.colors.accent.coral]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.avatar, styles.fallback, style]}
      accessibilityLabel={name}
    >
      <Text style={styles.initials}>{initials}</Text>
    </LinearGradient>
  );
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], dimension: number) {
  return StyleSheet.create({
    avatar: {
      width: dimension,
      height: dimension,
      borderRadius: Math.round(dimension * 0.34),
    },
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      fontFamily: theme.typography.fonts.ui.semibold,
      fontSize: dimension * 0.36,
      color: theme.colors.text.inverse,
    },
  });
}
