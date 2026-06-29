import { useMemo, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export type GradientVariant = 'primary' | 'gold' | 'goldSoft';

type GradientSurfaceProps = {
  children: ReactNode;
  variant?: GradientVariant;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  padded?: boolean;
};

export function GradientSurface({
  children,
  variant = 'primary',
  style,
  borderRadius,
  padded = true,
}: GradientSurfaceProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, borderRadius ?? theme.radii.card), [theme, borderRadius]);
  const colors = useMemo(() => {
    if (variant === 'gold') {
      return [theme.colors.accent.goldMuted, theme.colors.surface.default] as const;
    }
    if (variant === 'goldSoft') {
      return ['#FFFBF2', theme.colors.surface.default] as const;
    }
    return [theme.colors.brand.primary, theme.colors.brand.primaryHover] as const;
  }, [theme, variant]);

  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.root, padded && styles.padded, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** Flat gold-tinted card matching design-board AI panels */
export function AIGoldCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createAiCardStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={['#FFFBF2', theme.colors.surface.default]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], borderRadius: number) {
  return StyleSheet.create({
    root: {
      borderRadius,
      overflow: 'hidden',
    },
    padded: {
      padding: theme.spacing.lg,
    },
  });
}

function createAiCardStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      borderRadius: theme.radii.card,
      borderWidth: 1.5,
      borderColor: theme.colors.accent.gold,
      overflow: 'hidden',
      ...theme.shadows.card,
    },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
  });
}
