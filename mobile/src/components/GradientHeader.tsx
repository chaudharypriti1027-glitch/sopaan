import { useMemo, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { PREMIUM } from './premium/premiumStyles';

type GradientHeaderProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
};

/** Primary gradient header strip — composes theme tokens only. */
export function GradientHeader({
  children,
  style,
  contentStyle,
  padded = true,
}: GradientHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, padded), [theme, padded]);

  return (
    <LinearGradient
      colors={[...PREMIUM.headerGradient]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.root, style]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], padded: boolean) {
  return StyleSheet.create({
    root: {
      borderBottomLeftRadius: theme.radii.card,
      borderBottomRightRadius: theme.radii.card,
      overflow: 'hidden',
    },
    content: {
      paddingHorizontal: padded ? theme.spacing.lgPlus : theme.spacing.none,
      paddingTop: padded ? theme.spacing.lg : theme.spacing.none,
      paddingBottom: padded ? theme.spacing.xl : theme.spacing.none,
      gap: theme.spacing.sm,
    },
  });
}
