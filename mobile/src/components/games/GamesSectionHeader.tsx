import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { GAMES_UI } from './gamesTheme';

type GamesSectionHeaderProps = {
  title: string;
  action?: string;
  onActionPress?: () => void;
};

export function GamesSectionHeader({ title, action, onActionPress }: GamesSectionHeaderProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    action: {
      fontSize: 12,
      fontWeight: '700',
      color: GAMES_UI.accent,
    },
  });
}
