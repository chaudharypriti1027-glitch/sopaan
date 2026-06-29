import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

type GoalDotsProps = {
  done: number;
  total: number;
  variant?: 'default' | 'hero';
};

export function GoalDots({ done, total, variant = 'default' }: GoalDotsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  return (
    <View style={styles.row} accessibilityLabel={`${done} of ${total} goals complete`}>
      {Array.from({ length: total }, (_, index) => {
        const filled = index < done;

        if (filled) {
          return (
            <LinearGradient
              key={index}
              colors={variant === 'hero' ? ['#34D399', '#06B6D4'] : ['#0FA896', '#16C6B0']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.dot, styles.dotFilled]}
            />
          );
        }

        return <View key={index} style={styles.dot} />;
      })}
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  variant: 'default' | 'hero',
) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 6,
      marginTop: variant === 'hero' ? 0 : 9,
    },
    dot: {
      flex: 1,
      height: variant === 'hero' ? 6 : 7,
      borderRadius: 99,
      backgroundColor: variant === 'hero' ? 'rgba(255,255,255,0.15)' : theme.colors.border.subtle,
    },
    dotFilled: {
      backgroundColor: 'transparent',
    },
  });
}
