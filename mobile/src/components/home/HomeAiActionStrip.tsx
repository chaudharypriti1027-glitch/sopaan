import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { HOME_AI_ACTION_TILES } from '../../content/homeContent';
import { useTheme } from '../../theme';
import { HOME_UI, homePressFeedback } from './homeTheme';

type HomeAiActionStripProps = {
  onGenerateTest: () => void;
  onGames: () => void;
  onAskAi: () => void;
  onExamPlan: () => void;
};

export function HomeAiActionStrip({
  onGenerateTest,
  onGames,
  onAskAi,
  onExamPlan,
}: HomeAiActionStripProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const pressByKey = useMemo(
    () => ({
      generate: onGenerateTest,
      games: onGames,
      ask: onAskAi,
      plan: onExamPlan,
    }),
    [onAskAi, onExamPlan, onGames, onGenerateTest],
  );

  const tiles = useMemo(
    () =>
      HOME_AI_ACTION_TILES.map((tile) => ({
        ...tile,
        label: t(`home.${tile.labelKey}`),
        subtitle: t(`home.${tile.subtitleKey}`),
        onPress: pressByKey[tile.key],
      })),
    [pressByKey, t],
  );

  return (
    <View style={styles.wrap} testID="home-ai-action-strip">
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          accessibilityRole="button"
          onPress={tile.onPress}
          style={({ pressed }) => [styles.tile, pressed && homePressFeedback]}
          testID={tile.testID}
        >
          <LinearGradient
            colors={[...tile.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            <tile.Icon size={18} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
          <View style={styles.copy}>
            <Text style={styles.label} numberOfLines={1}>
              {tile.label}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {tile.subtitle}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tile: {
      width: '48%',
      flexGrow: 1,
      minWidth: '46%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 12,
      borderRadius: HOME_UI.innerRadius,
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: HOME_UI.border,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
      gap: 3,
      paddingTop: 1,
    },
    label: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: HOME_UI.ink,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
  });
}
