import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { premiumCard } from '../premium';

type PremiumFeatureCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Elevated card matching Home / Practice premium surfaces. */
export function PremiumFeatureCard({ children, style }: PremiumFeatureCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      ...premiumCard(theme),
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
  });
}
