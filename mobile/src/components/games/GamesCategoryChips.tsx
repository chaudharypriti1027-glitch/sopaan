import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { GAMES_UI } from './gamesTheme';
import type { GameCategory } from '../../games/types';

type GamesCategoryChipsProps = {
  options: { key: GameCategory; label: string }[];
  active: GameCategory;
  onChange: (key: GameCategory) => void;
};

export function GamesCategoryChips({ options, active, onChange }: GamesCategoryChipsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const isActive = option.key === active;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.key)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      paddingVertical: 10,
      paddingBottom: 4,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: GAMES_UI.borderSoft,
      backgroundColor: GAMES_UI.surface,
    },
    chipActive: {
      backgroundColor: GAMES_UI.accent,
      borderColor: 'transparent',
      shadowColor: GAMES_UI.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 3,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    labelActive: {
      color: '#FFFFFF',
    },
  });
}
