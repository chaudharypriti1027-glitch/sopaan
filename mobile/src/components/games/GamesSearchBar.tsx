import { Search } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { GAMES_UI } from './gamesTheme';

type GamesSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export function GamesSearchBar({ value, onChangeText, placeholder }: GamesSearchBarProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <Search size={16} color={GAMES_UI.muted} strokeWidth={2} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={GAMES_UI.muted}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: GAMES_UI.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: GAMES_UI.text,
      padding: 0,
    },
  });
}
