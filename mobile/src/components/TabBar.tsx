import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Newspaper, PenLine, Sparkles, User } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { denseTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { homeNavShadow } from './home/homeStyles';
import { FLOATING_TAB_BAR_HEIGHT } from '../navigation/tabBarConstants';
import { isAskAiScreenOpen, navigateToAskAI } from '../navigation/askAiNavigation';

type TabRoute = 'Home' | 'Practice' | 'CurrentAffairs' | 'Profile';

type TabIconComponent = typeof Home;

const LEFT_TABS: TabRoute[] = ['Home', 'Practice'];
const RIGHT_TABS: TabRoute[] = ['CurrentAffairs', 'Profile'];

const TAB_ICONS: Record<TabRoute, TabIconComponent> = {
  Home,
  Practice: PenLine,
  CurrentAffairs: Newspaper,
  Profile: User,
};

const TAB_LABEL_KEYS: Record<TabRoute, string> = {
  Home: 'home',
  Practice: 'practice',
  CurrentAffairs: 'currentAffairs',
  Profile: 'profile',
};

type TabBarProps = BottomTabBarProps;

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    const iconColor = isFocused ? theme.colors.tabBar.active : theme.colors.tabBar.inactive;

    return (
      <Pressable
        key={routeName}
        accessibilityRole="tab"
        accessibilityLabel={t(TAB_LABEL_KEYS[routeName])}
        accessibilityState={{ selected: isFocused }}
        onPress={() => navigation.navigate(route.name)}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      >
        <Icon size={22} color={iconColor} strokeWidth={isFocused ? 2.25 : 1.75} />
        <Text {...denseTextProps} style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
          {t(TAB_LABEL_KEYS[routeName])}
        </Text>
      </Pressable>
    );
  };

  const aiIconColor = aiFocused ? theme.colors.tabBar.active : theme.colors.tabBar.inactive;

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[styles.floatingBar, homeNavShadow(theme)]}>
        <View style={styles.sideGroup}>{LEFT_TABS.map(renderTab)}</View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('fabAskAi')}
          accessibilityState={{ selected: aiFocused }}
          onPress={openAskAi}
          style={({ pressed }) => [styles.aiTab, pressed && styles.tabPressed]}
        >
          <View style={[styles.aiIconWrap, aiFocused && styles.aiIconWrapFocused]}>
            <Sparkles size={22} color={aiIconColor} strokeWidth={aiFocused ? 2.25 : 1.75} />
          </View>
          <Text {...denseTextProps} style={[styles.tabLabel, aiFocused && styles.tabLabelFocused]}>
            {t('askAi')}
          </Text>
        </Pressable>

        <View style={styles.sideGroup}>{RIGHT_TABS.map(renderTab)}</View>
      </View>
    </View>
  );
}

export { FLOATING_TAB_BAR_HEIGHT };

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    outer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 14,
      backgroundColor: 'transparent',
      pointerEvents: 'box-none',
    },
    floatingBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minHeight: FLOATING_TAB_BAR_HEIGHT,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.94)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.85)',
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
      gap: 3,
      paddingTop: 4,
    },
    aiTab: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 52,
      gap: 3,
      paddingTop: 4,
      paddingHorizontal: 4,
    },
    aiIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    aiIconWrapFocused: {
      backgroundColor: theme.colors.brand.primaryMuted,
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
  });
}
