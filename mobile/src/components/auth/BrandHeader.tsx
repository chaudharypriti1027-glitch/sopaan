import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SopaanLogo } from '../SopaanLogo';
import { Text } from '../Text';
import { useTheme } from '../../theme';

type BrandHeaderProps = {
  title: string;
  subtitle?: string;
  logoSize?: number;
};

/** Small logo lockup + screen title + muted subtitle for auth screens. */
export function BrandHeader({ title, subtitle, logoSize = 56 }: BrandHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <View style={styles.logoCard}>
        <SopaanLogo size={logoSize} />
      </View>
      <Text variant="h2" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    logoCard: {
      padding: theme.spacing.md,
      borderRadius: theme.radii.card,
      backgroundColor: theme.colors.surface.default,
      ...theme.shadows.card,
    },
    title: {
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    subtitle: {
      textAlign: 'center',
      maxWidth: 320,
    },
  });
}
