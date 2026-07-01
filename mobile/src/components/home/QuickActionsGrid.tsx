import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PremiumIcon } from '../premium/PremiumIcon';
import type { PremiumIconTone } from '../premium/premiumIconTokens';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { resolveHomeIcon } from './homeUtils';
import { HOME_UI } from './homeTheme';
import { premiumTileShadow } from '../premium/premiumStyles';

type QuickActionsGridProps = {
  actions: HomeFeed['quickActions'];
  onActionPress?: (deeplink: string) => void;
};

const TILE_TONES: Record<string, PremiumIconTone> = {
  test: 'lavender',
  ai: 'gold',
  ca: 'mint',
  games: 'rose',
  mock: 'violet',
};

const QUICK_ACTION_LABEL_KEYS: Record<string, string> = {
  test: 'home.takeTest',
  ai: 'home.askAi',
  ca: 'home.affairsShort',
  games: 'home.games',
  mock: 'home.mock',
};

export function QuickActionsGrid({ actions, onActionPress }: QuickActionsGridProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!actions.length) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.grid}>
        {actions.map((action) => {
          const Icon = resolveHomeIcon(action.icon);
          const tone = TILE_TONES[action.key] ?? 'lavender';
          const labelKey = QUICK_ACTION_LABEL_KEYS[action.key];
          const label = labelKey ? t(labelKey) : action.label;

          return (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => onActionPress?.(action.deeplink)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <PremiumIcon Icon={Icon} tone={tone} size="md" filled />
              <Text style={styles.label} numberOfLines={2}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    shell: {
      backgroundColor: HOME_UI.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      padding: 14,
      ...premiumTileShadow(theme),
    },
    grid: {
      flexDirection: 'row',
      gap: 10,
    },
    card: {
      flex: 1,
      borderRadius: 18,
      backgroundColor: HOME_UI.tileBg,
      paddingVertical: 14,
      paddingHorizontal: 6,
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: HOME_UI.borderSoft,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    label: {
      fontSize: 11,
      lineHeight: 13,
      textAlign: 'center',
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.ink,
      letterSpacing: 0.1,
    },
  });
}
