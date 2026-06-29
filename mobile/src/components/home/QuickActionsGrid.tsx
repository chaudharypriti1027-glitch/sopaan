import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { resolveHomeIcon } from './homeUtils';
import { HOME_UI } from './homeTheme';

type QuickActionsGridProps = {
  actions: HomeFeed['quickActions'];
  onActionPress?: (deeplink: string) => void;
};

const TILE_STYLES: Record<string, { bg: string; border: string; iconBorder: string; fg: string }> = {
  test: { bg: '#EEEDFD', border: '#C7D2FE', iconBorder: '#C7D2FE', fg: '#6366F1' },
  ai: { bg: '#FFFBEB', border: '#FDE68A', iconBorder: '#FDE68A', fg: '#F59E0B' },
  ca: { bg: '#ECFDF5', border: '#A7F3D0', iconBorder: '#A7F3D0', fg: '#10B981' },
  games: { bg: '#FDF2F8', border: '#FBCFE8', iconBorder: '#FBCFE8', fg: '#EC4899' },
  mock: { bg: '#FDF2F8', border: '#FBCFE8', iconBorder: '#FBCFE8', fg: '#EC4899' },
};

function tileStyle(key: string) {
  return (
    TILE_STYLES[key] ?? {
      bg: HOME_UI.accentSoft,
      border: HOME_UI.borderSoft,
      iconBorder: HOME_UI.borderSoft,
      fg: HOME_UI.accent,
    }
  );
}

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
        const tile = tileStyle(action.key);

        const labelKey = QUICK_ACTION_LABEL_KEYS[action.key];
        const label = labelKey ? t(labelKey) : action.label;

        return (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => onActionPress?.(action.deeplink)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: tile.bg, borderColor: tile.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.icon, { borderColor: tile.iconBorder }]}>
              <Icon size={22} color={tile.fg} strokeWidth={1.8} />
            </View>
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
      borderRadius: 22,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      padding: 12,
      shadowColor: '#1A0A5E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    grid: {
      flexDirection: 'row',
      gap: 8,
    },
    card: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1.5,
      paddingVertical: 14,
      paddingHorizontal: 6,
      alignItems: 'center',
      gap: 8,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.75)',
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    label: {
      fontSize: 11,
      lineHeight: 13,
      textAlign: 'center',
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#4B5563',
      letterSpacing: 0.1,
    },
  });
}
