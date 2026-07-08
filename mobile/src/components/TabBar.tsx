import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BookOpen, CircleUser, LayoutGrid, Newspaper, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { denseTextProps } from '../a11y/textProps';
import { useResponsiveLayout } from '../layout/responsive';
import { useTheme } from '../theme';
import { PREMIUM, premiumNavShadow } from './premium/premiumStyles';
import { PremiumIcon } from './premium';
import type { PremiumIconTone } from './premium/premiumIconTokens';
import { FLOATING_TAB_BAR_HEIGHT } from '../navigation/tabBarConstants';
import { isAskAiScreenOpen, navigateToAskAI } from '../navigation/askAiNavigation';

type TabRoute = 'Home' | 'Practice' | 'CurrentAffairs' | 'Profile';

type TabIconComponent = typeof LayoutGrid;

const LEFT_TABS: TabRoute[] = ['Home', 'Practice'];
const RIGHT_TABS: TabRoute[] = ['CurrentAffairs', 'Profile'];

const TAB_ICONS: Record<TabRoute, TabIconComponent> = {
  Home: LayoutGrid,
  Practice: BookOpen,
  CurrentAffairs: Newspaper,
  Profile: CircleUser,
};

const TAB_LABEL_KEYS: Record<TabRoute, string> = {
  Home: 'home',
  Practice: 'practice',
  CurrentAffairs: 'currentAffairs',
  Profile: 'profile',
};

const TAB_TONES: Record<TabRoute, PremiumIconTone> = {
  Home: 'lavender',
  Practice: 'mint',
  CurrentAffairs: 'coral',
  Profile: 'slate',
};

type TabBarProps = BottomTabBarProps;

export function TabBar({ state, navigation }: TabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWeb, contentPadding } = useResponsiveLayout();
  const horizontalPad = isWeb ? (contentPadding ?? 16) : 16;
  const styles = useMemo(() => createStyles(theme, horizontalPad), [theme, horizontalPad]);
  const { t } = useTranslation('navigation');

  const aiFocused = isAskAiScreenOpen(navigation);
  const bottomPad = Math.max(insets.bottom, 10);

  const openAskAi = () => {
    navigateToAskAI(navigation);
  };

  const renderTab = (routeName: TabRoute) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) {
      return null;
    }

    const index = state.routes.findIndex((r) => r.name === routeName);
    const isFocused = state.index === index && !aiFocused;
    const Icon = TAB_ICONS[routeName];
    const tone = TAB_TONES[routeName];

    return (
      <Pressable
        key={routeName}
        accessibilityRole="tab"
        accessibilityLabel={t(TAB_LABEL_KEYS[routeName])}
        accessibilityState={{ selected: isFocused }}
        onPress={() => navigation.navigate(route.name)}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      >
        <PremiumIcon
          Icon={Icon}
          tone={tone}
          size="sm"
          active={isFocused}
          filled
          depth={isFocused}
        />
        <Text {...denseTextProps} style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
          {t(TAB_LABEL_KEYS[routeName])}
        </Text>
        {isFocused ? <View style={styles.activePill} /> : <View style={styles.pillSpacer} />}
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.outer, { paddingBottom: bottomPad }]}
      pointerEvents="box-none"
    >
      <View style={[styles.shadowWrap, premiumNavShadow(theme)]}>
        <View style={styles.bar}>
          <View style={styles.sideGroup}>{LEFT_TABS.map(renderTab)}</View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('fabAskAi')}
            accessibilityState={{ selected: aiFocused }}
            onPress={openAskAi}
            style={({ pressed }) => [styles.aiTab, pressed && styles.tabPressed]}
          >
            <PremiumIcon
              Icon={Sparkles}
              size="sm"
              tone="gold"
              active={aiFocused}
              filled
              depth={aiFocused}
            />
            <Text {...denseTextProps} style={[styles.tabLabel, aiFocused && styles.tabLabelAi]}>
              {t('askAi')}
            </Text>
            {aiFocused ? <View style={[styles.activePill, styles.activePillGold]} /> : <View style={styles.pillSpacer} />}
          </Pressable>

          <View style={styles.sideGroup}>{RIGHT_TABS.map(renderTab)}</View>
        </View>
      </View>
    </View>
  );
}

export { FLOATING_TAB_BAR_HEIGHT };

function createStyles(theme: ReturnType<typeof useTheme>['theme'], horizontalPad: number) {
  return StyleSheet.create({
    outer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: horizontalPad,
      zIndex: 100,
      ...Platform.select({
        android: { elevation: 24 },
        default: {},
      }),
    },
    shadowWrap: {
      borderRadius: 28,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: FLOATING_TAB_BAR_HEIGHT,
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 28,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(236,232,221,0.95)',
      overflow: 'hidden',
    },
    sideGroup: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      minHeight: 56,
      paddingHorizontal: 2,
    },
    aiTab: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      minWidth: 58,
      minHeight: 56,
      paddingHorizontal: 4,
    },
    tabPressed: {
      opacity: 0.9,
    },
    tabLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: PREMIUM.sectionLabel,
      textAlign: 'center',
    },
    tabLabelFocused: {
      color: PREMIUM.accent,
    },
    tabLabelAi: {
      color: PREMIUM.goldDeep,
    },
    activePill: {
      width: 18,
      height: 3,
      borderRadius: 2,
      backgroundColor: PREMIUM.accent,
    },
    activePillGold: {
      backgroundColor: PREMIUM.gold,
    },
    pillSpacer: {
      width: 18,
      height: 3,
    },
  });
}
