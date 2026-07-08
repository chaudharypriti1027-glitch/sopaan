import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../Skeleton';
import { useTheme } from '../../theme';
import { PREMIUM } from './premiumStyles';

type QueryStateSkeletonProps = {
  rows?: number;
};

/** Card-shaped loading placeholders for list screens. */
export function QueryStateSkeleton({ rows = 3 }: QueryStateSkeletonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap} testID="query-state-skeleton">
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.card}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={styles.lines}>
            <Skeleton width="72%" height={14} borderRadius={6} />
            <Skeleton width="48%" height={11} borderRadius={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: PREMIUM.cardRadius,
      backgroundColor: theme.colors.surface.default,
      borderWidth: 1,
      borderColor: 'rgba(236,232,221,0.9)',
    },
    lines: {
      flex: 1,
      gap: 8,
    },
  });
}
