import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { denseTextProps } from '../../a11y/textProps';
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
        onPress: pressByKey[tile.key],
      })),
    [pressByKey, t],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.wrap}
      testID="home-ai-action-strip"
    >
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          accessibilityRole="button"
          accessibilityLabel={tile.label}
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
            <tile.Icon size={16} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
          <Text
            {...denseTextProps}
            style={styles.label}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {tile.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
      paddingRight: 4,
      alignItems: 'center',
    },
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 42,
      maxWidth: 160,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: HOME_UI.border,
    },
    iconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flexShrink: 1,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.ink,
      letterSpacing: -0.1,
    },
  });
}
