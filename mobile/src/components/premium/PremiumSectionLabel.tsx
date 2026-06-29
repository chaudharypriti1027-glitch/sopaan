import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { PREMIUM } from './premiumStyles';

type PremiumSectionLabelProps = {
  title: string;
  compact?: boolean;
};

export function PremiumSectionLabel({ title, compact = false }: PremiumSectionLabelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  return <Text style={styles.label}>{title}</Text>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], compact: boolean) {
  return StyleSheet.create({
    label: {
      marginTop: compact ? 16 : 22,
      marginBottom: 11,
      marginHorizontal: 6,
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: PREMIUM.sectionLabel,
    },
  });
}
