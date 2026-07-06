import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOME_UI } from './homeTheme';

type GoalDotsProps = {
  done: number;
  total: number;
  variant?: 'default' | 'hero';
};

export function GoalDots({ done, total, variant = 'default' }: GoalDotsProps) {
  const styles = useMemo(() => createStyles(variant), [variant]);

  return (
    <View style={styles.row} accessibilityLabel={`${done} of ${total} goals complete`}>
      {Array.from({ length: total }, (_, index) => {
        const filled = index < done;

        if (filled) {
          return (
            <LinearGradient
              key={index}
              colors={
                variant === 'hero'
                  ? [HOME_UI.goldLt, HOME_UI.gold]
                  : [HOME_UI.sage, HOME_UI.sageDeep]
              }
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

function createStyles(variant: 'default' | 'hero') {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 7,
      marginTop: variant === 'hero' ? 0 : 8,
    },
    dot: {
      flex: 1,
      height: variant === 'hero' ? 7 : 7,
      borderRadius: 99,
      backgroundColor: variant === 'hero' ? 'rgba(255,255,255,0.12)' : HOME_UI.borderSoft,
      borderWidth: variant === 'hero' ? 1 : 0,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    dotFilled: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
  });
}
