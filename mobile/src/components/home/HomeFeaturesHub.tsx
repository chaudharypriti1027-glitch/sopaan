import { Crown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomeProUpgradeStrip } from './HomeProUpgradeStrip';
import { SegTabs } from '../SegTabs';
import { Text } from '../Text';
import { useProGate } from '../../hooks/useProGate';
import {
  HOME_FEATURE_SECTION_KEYS,
  HOME_FEATURE_SECTIONS,
  type HomeFeatureLink,
  type HomeFeatureSectionKey,
} from '../../navigation/homeFeatureConfig';
import {
  HOME_EXPLORE_GRID,
  HOME_EXPLORE_TAB_LABEL_KEYS,
} from '../../content/homeContent';
import { denseTextProps } from '../../a11y/textProps';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { featureLinkPremiumTone } from './homeIcons';
import { HOME_UI, homeFeedCard, homePressFeedback } from './homeTheme';

type HomeFeaturesHubProps = {
  quickActions: HomeFeed['quickActions'];
  onFeaturePress: (link: HomeFeatureLink) => void;
  onShortcutPress: (deeplink: string) => void;
};

function exploreLabel(
  t: (key: string) => string,
  labelKey: HomeFeatureLink['labelKey'],
) {
  if (labelKey === 'revisionCapsules') {
    return t('navigation:revisionShort');
  }
  return t(`navigation:${labelKey}`);
}

export function HomeFeaturesHub({ onFeaturePress }: HomeFeaturesHubProps) {
  const { t } = useTranslation(['app', 'navigation']);
  const { theme } = useTheme();
  const { isPro, openPaywall } = useProGate();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeSection, setActiveSection] = useState<HomeFeatureSectionKey>('learning');

  const section = HOME_FEATURE_SECTIONS.find((entry) => entry.titleKey === activeSection);
  const tabOptions = useMemo(
    () =>
      HOME_FEATURE_SECTION_KEYS.map((key) => ({
        key,
        label: t(`app:home.${HOME_EXPLORE_TAB_LABEL_KEYS[key]}`),
      })),
    [t],
  );

  const handleFeatureTap = (link: HomeFeatureLink) => {
    // Soft badge only for marketing; screens + server enforce free quotas / pro-only.
    // Hard-block true Pro-only entry points here so Explore matches locked screens.
    if (!isPro && link.tierFeature === 'detailed_analytics') {
      openPaywall({ feature: 'detailed_analytics' });
      return;
    }
    if (!isPro && link.proHighlight && !link.tierFeature) {
      openPaywall();
      return;
    }
    onFeaturePress(link);
  };

  return (
    <View style={styles.wrap}>
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
              const label = exploreLabel(t, link.labelKey);
              const showPro = !isPro && link.proHighlight;

              return (
                <Pressable
                  key={`${activeSection}-${link.route}`}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={() => handleFeatureTap(link)}
                  style={({ pressed }) => [
                    styles.tile,
                    pressed && homePressFeedback,
                  ]}
                >
                  <View style={styles.iconWell}>
                    <HomeSlotIcon slot="grid" Icon={Icon} tone={iconTone} />
                    {showPro ? (
                      <View style={styles.proBadge}>
                        <Crown size={9} color="#FFFFFF" strokeWidth={2.6} />
                      </View>
                    ) : null}
                  </View>
                  <Text
                    {...denseTextProps}
                    style={styles.tileLabel}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    ellipsizeMode="tail"
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {!isPro ? <HomeProUpgradeStrip onPress={() => openPaywall()} /> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: 12,
    },
    exploreCard: {
      ...homeFeedCard(),
      borderRadius: 24,
      overflow: 'hidden',
    },
    cardInner: {
      padding: HOME_EXPLORE_GRID.cardPad,
      gap: 10,
    },
    tabs: {
      marginBottom: 0,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -(HOME_EXPLORE_GRID.tileGap / 2),
    },
    tile: {
      width: `${100 / HOME_EXPLORE_GRID.columns}%`,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      paddingTop: 2,
      paddingBottom: HOME_EXPLORE_GRID.rowGap,
      paddingHorizontal: HOME_EXPLORE_GRID.tileGap / 2,
      position: 'relative',
    },
    iconWell: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    proBadge: {
      position: 'absolute',
      top: -3,
      right: -4,
      zIndex: 2,
      width: 15,
      height: 15,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: HOME_UI.gold,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
    tileLabel: {
      width: '100%',
      fontSize: 11,
      lineHeight: 13,
      letterSpacing: -0.15,
      textAlign: 'center',
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.ink,
      paddingHorizontal: 1,
    },
  });
}
