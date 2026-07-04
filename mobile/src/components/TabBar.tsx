import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BookOpen, CircleUser, LayoutGrid, Newspaper, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { denseTextProps } from '../a11y/textProps';
import { useResponsiveLayout } from '../layout/responsive';
import { useTheme } from '../theme';
import { PremiumIcon } from './premium/PremiumIcon';
import { GlassSurface } from './GlassSurface';
import { homeNavShadow } from './home/homeStyles';
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

type TabBarProps = BottomTabBarProps;

export function TabBar({ state, navigation }: TabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWeb, contentPadding } = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(theme, isWeb ? (contentPadding ?? 14) : 14),
    [theme, isWeb, contentPadding],
  );
  const { t } = useTranslation('navigation');

  const aiFocused = isAskAiScreenOpen(navigation);

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

    return (
      <Pressable
        key={routeName}
        accessibilityRole="tab"
        accessibilityLabel={t(TAB_LABEL_KEYS[routeName])}
        accessibilityState={{ selected: isFocused }}
        onPress={() => navigation.navigate(route.name)}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      >
        <PremiumIcon Icon={Icon} size="sm" active={isFocused} filled={isFocused} />
        <Text {...denseTextProps} style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
          {t(TAB_LABEL_KEYS[routeName])}
        </Text>
        {isFocused ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
      </Pressable>
    );
  };

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[styles.shadowWrap, homeNavShadow(theme)]}>
        <GlassSurface tone="light" intensity={54} borderRadius={30} style={styles.floatingBar}>
          <View style={styles.sideGroup}>{LEFT_TABS.map(renderTab)}</View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('fabAskAi')}
            accessibilityState={{ selected: aiFocused }}
            onPress={openAskAi}
            style={({ pressed }) => [styles.aiTab, pressed && styles.tabPressed]}
          >
            <PremiumIcon Icon={Sparkles} size="sm" tone="gold" active={aiFocused} filled={aiFocused} />
            <Text {...denseTextProps} style={[styles.tabLabel, aiFocused && styles.tabLabelFocused]}>
              {t('askAi')}
            </Text>
            {aiFocused ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
          </Pressable>

          <View style={styles.sideGroup}>{RIGHT_TABS.map(renderTab)}</View>
        </GlassSurface>
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
      backgroundColor: 'transparent',
      pointerEvents: 'box-none',
    },
    shadowWrap: {
      borderRadius: 30,
    },
    floatingBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minHeight: FLOATING_TAB_BAR_HEIGHT,
      paddingHorizontal: 6,
      paddingBottom: 8,
      paddingTop: 10,
    },
    sideGroup: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      paddingBottom: 2,
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 52,
      gap: 2,
      paddingTop: 2,
    },
    aiTab: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 52,
      gap: 2,
      paddingTop: 2,
      paddingHorizontal: 4,
    },
    tabPressed: {
      opacity: 0.88,
    },
    tabLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: theme.colors.tabBar.inactive,
    },
    tabLabelFocused: {
      color: theme.colors.tabBar.active,
    },
    activeDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.tabBar.active,
      marginTop: 1,
    },
    dotSpacer: {
      width: 5,
      height: 5,
      marginTop: 1,
    },
  });
}
