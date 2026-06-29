import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';
import type { GameCategory } from '../../games/types';

type GamesCategoryChipsProps = {
  options: { key: GameCategory; label: string }[];
  active: GameCategory;
  onChange: (key: GameCategory) => void;
};

export function GamesCategoryChips({ options, active, onChange }: GamesCategoryChipsProps) {
  const styles = useMemo(() => createStyles(), []);

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

function createStyles() {
  return StyleSheet.create({
    row: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      backgroundColor: GAMES_UI.surface,
      shadowColor: GAMES_UI.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
    },
    chipActive: {
      backgroundColor: GAMES_UI.accent,
      borderColor: 'transparent',
      shadowColor: GAMES_UI.accent,
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    labelActive: {
      color: '#FFFFFF',
    },
  });
}
