import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GlassSurface } from '../GlassSurface';
import { useTheme } from '../../theme';
import { homePremiumCard } from '../home/homeStyles';
import { GAMES_UI } from './gamesTheme';

type GamesPlayCardProps = {
  children: ReactNode;
};

/** Premium frosted play surface — wraps in-game UI in an elevated card. */
export function GamesPlayCard({ children }: GamesPlayCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <GlassSurface tone="light" intensity={36} borderRadius={22} style={styles.glass}>
        <View style={styles.card}>{children}</View>
      </GlassSurface>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 22,
    },
    glass: {
      overflow: 'hidden',
    },
    card: {
      ...homePremiumCard(theme),
      borderRadius: 22,
      padding: 18,
      borderColor: GAMES_UI.borderSoft,
      backgroundColor: GAMES_UI.surface,
    },
  });
}
