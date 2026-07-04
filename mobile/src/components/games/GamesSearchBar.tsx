import { Search } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { GlassSurface } from '../GlassSurface';
import { GAMES_UI } from './gamesTheme';
import { platformShadow } from '../../utils/platformShadow';

type GamesSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export function GamesSearchBar({ value, onChangeText, placeholder }: GamesSearchBarProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <GlassSurface tone="light" intensity={40} borderRadius={16} style={styles.glass}>
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
      </GlassSurface>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      paddingTop: 6,
      paddingBottom: 4,
      ...platformShadow({ color: GAMES_UI.shadow, offsetY: 4, opacity: 0.06, radius: 16, elevation: 2 }),
    },
    glass: {
      overflow: 'hidden',
    },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: GAMES_UI.surface,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: GAMES_UI.text,
      padding: 0,
    },
  });
}
