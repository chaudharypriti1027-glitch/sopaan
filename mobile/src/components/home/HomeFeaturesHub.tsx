import { Crown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlassSurface } from '../GlassSurface';
import { PremiumIcon } from '../premium/PremiumIcon';
import { SegTabs } from '../SegTabs';
import { Text } from '../Text';
import { useProGate } from '../../hooks/useProGate';
import {
  HOME_FEATURE_SECTION_KEYS,
  HOME_FEATURE_SECTIONS,
  type HomeFeatureLink,
  type HomeFeatureSectionKey,
} from '../../navigation/homeFeatureConfig';
import { toneForText } from '../../utils/iconTone';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { featureLinkPremiumTone } from './homeIconTone';
import { resolveHomeIcon } from './homeUtils';
import { homeNavShadow } from './homeStyles';
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
    <View style={styles.wrap}>
      {!isPro ? (
        <GlassSurface tone="gold" intensity={40} borderRadius={14} style={styles.proStripGlass}>
          <Pressable
            accessibilityRole="button"
            onPress={() => openPaywall()}
            style={({ pressed }) => [styles.proStrip, pressed && styles.pressed]}
            testID="home-explore-premium"
          >
            <PremiumIcon Icon={Crown} tone="gold" size="sm" filled />
            <View style={styles.proCopy}>
              <Text style={styles.proTitle}>{t('app:home.premiumStripTitle')}</Text>
              <Text style={styles.proSubtitle} numberOfLines={1}>
                {t('app:home.premiumStripSubtitle')}
              </Text>
            </View>
            <Text style={styles.proCta}>{t('app:home.premiumStripCta')}</Text>
          </Pressable>
        </GlassSurface>
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
            const tone = toneForText(action.key);
            return (
              <GlassSurface
                key={action.key}
                tone="light"
                intensity={48}
                borderRadius={999}
                style={styles.shortcutGlass}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onShortcutPress(action.deeplink)}
                  style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
                >
                  <PremiumIcon Icon={Icon} tone={tone} size="sm" filled />
                  <Text style={styles.shortcutLabel} numberOfLines={1}>
                    {action.label}
                  </Text>
                </Pressable>
              </GlassSurface>
            );
          })}
        </ScrollView>
      ) : null}

      <GlassSurface tone="light" intensity={52} borderRadius={22} style={[styles.cardGlass, homeNavShadow(theme)]}>
        <View style={styles.cardInner}>
          <SegTabs
            options={tabOptions}
            value={activeSection}
            onChange={setActiveSection}
            style={styles.tabs}
          />

          <View style={styles.grid}>
            {section?.links.map((link) => {
              const Icon = link.icon;
              const iconTone = featureLinkPremiumTone(link.tone);
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
                  <View style={styles.iconWrap}>
                    <PremiumIcon Icon={Icon} tone={iconTone} size="sm" filled />
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
      </GlassSurface>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
    },
    proStripGlass: {
      overflow: 'hidden',
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
    shortcutGlass: {
      overflow: 'hidden',
    },
    shortcut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
    cardGlass: {
      overflow: 'hidden',
    },
    cardInner: {
      padding: CARD_PAD,
      gap: 10,
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
      position: 'relative',
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
      fontSize: 10,
      lineHeight: 12,
      textAlign: 'center',
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.ink,
      minHeight: 24,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
  });
}
