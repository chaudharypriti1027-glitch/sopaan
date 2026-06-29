import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useTheme } from '../theme';

export type PaletteItemState = 'default' | 'answered' | 'current' | 'review';

type QuestionPaletteProps = {
  total: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  reviewIndices: Set<number>;
  onSelect: (index: number) => void;
  style?: ViewStyle;
};

export function QuestionPalette({
  total,
  currentIndex,
  answeredIndices,
  reviewIndices,
  onSelect,
  style,
}: QuestionPaletteProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.grid}>
        {Array.from({ length: total }, (_, index) => {
          const state: PaletteItemState =
            index === currentIndex
              ? 'current'
              : reviewIndices.has(index)
                ? 'review'
                : answeredIndices.has(index)
                  ? 'answered'
                  : 'default';

          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`Question ${index + 1}`}
              onPress={() => onSelect(index)}
              style={[styles.cell, styles[`cell_${state}`]]}
            >
              <Text style={[styles.cellText, styles[`cellText_${state}`]]}>{index + 1}</Text>
              {reviewIndices.has(index) ? (
                <Bookmark
                  size={10}
                  color={theme.colors.accent.goldOn}
                  style={styles.reviewIcon}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: theme.spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    cell: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.sm + 3,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    cell_default: {
      backgroundColor: theme.colors.surface.default,
      borderColor: theme.colors.border.default,
    },
    cell_answered: {
      backgroundColor: theme.colors.accent.tealMuted,
      borderColor: theme.colors.accent.teal,
    },
    cell_current: {
      backgroundColor: theme.colors.accent.gold,
      borderColor: theme.colors.accent.gold,
    },
    cell_review: {
      backgroundColor: theme.colors.accent.goldMuted,
      borderColor: theme.colors.accent.gold,
    },
    cellText: {
      ...theme.typography.presets.label,
      color: theme.colors.text.secondary,
    },
    cellText_default: {
      color: theme.colors.text.secondary,
    },
    cellText_answered: {
      color: theme.colors.accent.teal,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    cellText_current: {
      color: theme.colors.surface.default,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    cellText_review: {
      color: theme.colors.accent.goldOn,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    reviewIcon: {
      position: 'absolute',
      top: 2,
      right: 2,
    },
  });
}
