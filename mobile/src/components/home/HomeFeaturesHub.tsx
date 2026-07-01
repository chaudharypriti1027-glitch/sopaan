import { Crown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SegTabs } from '../SegTabs';
import { Text } from '../Text';
import { useProGate } from '../../hooks/useProGate';
import {
  HOME_FEATURE_SECTION_KEYS,
  HOME_FEATURE_SECTIONS,
  HOME_FEATURE_TONE_COLORS,
  type HomeFeatureLink,
  type HomeFeatureSectionKey,
} from '../../navigation/homeFeatureConfig';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { resolveHomeIcon } from './homeUtils';
import { HOME_UI } from './homeTheme';

const GRID_COLUMNS = 5;
const SECTION_PAD = 16;
const CARD_PAD = 10;
const TILE_GAP = 6;

type HomeFeaturesHubProps = {
  quickActions: HomeFeed['quickActions'];
  onFeaturePress: (link: HomeFeatureLink) => void;
  onShortcutPress: (deeplink: string) => void;
};

const TAB_LABEL_KEYS: Record<HomeFeatureSectionKey, string> = {
  learning: 'home.exploreTabLearning',
  prep: 'home.exploreTabPrep',
  community: 'home.exploreTabCommunity',
  tools: 'home.exploreTabTools',
};

export function HomeFeaturesHub({
  quickActions,
  onFeaturePress,
  onShortcutPress,
}: HomeFeaturesHubProps) {
  const { t } = useTranslation(['app', 'navigation']);
  const { theme } = useTheme();
  const { isPro, openPaywall } = useProGate();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeSection, setActiveSection] = useState<HomeFeatureSectionKey>('learning');

  const tileWidth = useMemo(() => {
    const contentWidth = screenWidth - SECTION_PAD * 2 - CARD_PAD * 2;
    return Math.floor((contentWidth - TILE_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
  }, [screenWidth]);

  const section = HOME_FEATURE_SECTIONS.find((entry) => entry.titleKey === activeSection);
  const tabOptions = useMemo(
    () =>
      HOME_FEATURE_SECTION_KEYS.map((key) => ({
        key,
        label: t(`app:${TAB_LABEL_KEYS[key]}`),
      })),
    [t],
  );

  const handleFeatureTap = (link: HomeFeatureLink) => {
    if (!isPro && (link.proHighlight || link.tierFeature)) {
      openPaywall(link.tierFeature ? { feature: link.tierFeature } : undefined);
      return;
    }
    onFeaturePress(link);
  };

  return (
    <View style={styles.wrap} testID="home-section-features">
      {!isPro ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => openPaywall()}
          style={({ pressed }) => [styles.proStrip, pressed && styles.pressed]}
          testID="home-explore-premium"
        >
          <View style={styles.proIcon}>
            <Crown size={14} color={HOME_UI.goldDeep} strokeWidth={2.2} />
          </View>
          <View style={styles.proCopy}>
            <Text style={styles.proTitle}>{t('app:home.premiumStripTitle')}</Text>
            <Text style={styles.proSubtitle} numberOfLines={1}>
              {t('app:home.premiumStripSubtitle')}
            </Text>
          </View>
          <Text style={styles.proCta}>{t('app:home.premiumStripCta')}</Text>
        </Pressable>
      ) : null}

      {quickActions.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsRow}
          testID="home-section-explore-shortcuts"
        >
          {quickActions.map((action) => {
            const Icon = resolveHomeIcon(action.icon);
            return (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                onPress={() => onShortcutPress(action.deeplink)}
                style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
              >
                <Icon size={16} color={HOME_UI.accent} strokeWidth={2} />
                <Text style={styles.shortcutLabel} numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.card}>
        <SegTabs
          options={tabOptions}
          value={activeSection}
          onChange={setActiveSection}
          style={styles.tabs}
        />

        <View style={styles.grid}>
          {section?.links.map((link) => {
            const Icon = link.icon;
            const colors = HOME_FEATURE_TONE_COLORS[link.tone];
            const label = t(`navigation:${link.labelKey}`);
            const showPro = !isPro && link.proHighlight;

            return (
              <Pressable
                key={`${activeSection}-${link.route}`}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => handleFeatureTap(link)}
                style={({ pressed }) => [styles.tile, { width: tileWidth }, pressed && styles.pressed]}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
                  <Icon size={17} color={colors.fg} strokeWidth={2} />
                  {showPro ? (
                    <View style={styles.proBadge}>
                      <Crown size={8} color={HOME_UI.goldDeep} strokeWidth={2.5} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tileLabel} numberOfLines={2}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
    },
    proStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: HOME_UI.goldSoft,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#EADFC4',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    proIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    proCopy: {
      flex: 1,
      gap: 1,
    },
    proTitle: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.goldDeep,
    },
    proSubtitle: {
      fontSize: 11,
      lineHeight: 13,
      color: HOME_UI.goldDeep,
    },
    proCta: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.goldDeep,
    },
    shortcutsRow: {
      gap: 8,
      paddingVertical: 2,
    },
    shortcut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: HOME_UI.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    shortcutLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.ink,
      maxWidth: 96,
    },
    card: {
      backgroundColor: HOME_UI.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      padding: CARD_PAD,
      gap: 10,
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
    },
    tabs: {
      marginBottom: 2,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: TILE_GAP,
    },
    tile: {
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    proBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: HOME_UI.goldSoft,
      borderWidth: 1,
      borderColor: '#EADFC4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileLabel: {
      fontSize: 9,
      lineHeight: 11,
      textAlign: 'center',
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.muted,
      minHeight: 22,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
  });
}
