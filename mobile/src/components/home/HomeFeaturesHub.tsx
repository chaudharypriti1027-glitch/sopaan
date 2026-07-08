import { Crown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomePremiumButton } from './HomePremiumButton';
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
import { featureLinkPremiumTone } from './homeIcons';
import { resolveHomeIcon } from './homeUtils';
import { HOME_UI, homeFeedCard, homePressFeedback } from './homeTheme';

const GRID_COLUMNS = 5;
const SECTION_PAD = HOME_UI.horizontalPad;
const CARD_PAD = 12;
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
              <Pressable
                key={action.key}
                accessibilityRole="button"
                onPress={() => onShortcutPress(action.deeplink)}
                style={({ pressed }) => [styles.shortcut, pressed && homePressFeedback]}
              >
                <HomeSlotIcon slot="shortcut" Icon={Icon} tone={tone} />
                <Text style={styles.shortcutLabel} numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.exploreCard}>
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
                  style={({ pressed }) => [styles.tile, { width: tileWidth }, pressed && homePressFeedback]}
                >
                  <HomeSlotIcon slot="grid" Icon={Icon} tone={iconTone} />
                  {showPro ? (
                    <View style={styles.proBadge}>
                      <HomeSlotIcon slot="micro" Icon={Crown} tone="gold" />
                    </View>
                  ) : null}
                  <Text style={styles.tileLabel} numberOfLines={2}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {!isPro ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => openPaywall()}
          style={({ pressed }) => [styles.proStrip, pressed && homePressFeedback]}
          testID="home-explore-premium"
        >
          <HomeSlotIcon slot="shortcut" Icon={Crown} tone="gold" />
          <View style={styles.proCopy}>
            <Text style={styles.proTitle}>{t('app:home.premiumStripTitle')}</Text>
            <Text style={styles.proSubtitle} numberOfLines={1}>
              {t('app:home.premiumStripSubtitle')}
            </Text>
          </View>
          <HomePremiumButton
            label={t('app:home.premiumStripCta')}
            variant="outline"
            size="sm"
            onPress={() => openPaywall()}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: 14,
    },
    shortcutsRow: {
      gap: 10,
      paddingVertical: 2,
      paddingRight: 4,
    },
    shortcut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: HOME_UI.border,
    },
    shortcutLabel: {
      fontSize: 12.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '700',
      color: HOME_UI.ink,
      maxWidth: 110,
    },
    exploreCard: {
      ...homeFeedCard(),
      overflow: 'hidden',
    },
    cardInner: {
      padding: CARD_PAD + 2,
      gap: 12,
    },
    tabs: {
      marginBottom: 2,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: TILE_GAP + 2,
    },
    tile: {
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 2,
      position: 'relative',
    },
    proBadge: {
      position: 'absolute',
      top: 0,
      right: 4,
      zIndex: 2,
    },
    tileLabel: {
      fontSize: 10.5,
      lineHeight: 13,
      textAlign: 'center',
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '700',
      color: HOME_UI.ink,
      minHeight: 26,
    },
    proStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: HOME_UI.goldSoft,
      borderRadius: HOME_UI.innerRadius,
      borderWidth: 1,
      borderColor: HOME_UI.goldBorder,
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
  });
}
