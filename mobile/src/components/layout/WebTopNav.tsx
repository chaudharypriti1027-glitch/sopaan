import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SopaanLogo } from '../SopaanLogo';
import { denseTextProps } from '../../a11y/textProps';
import { navigateToAskAI, isAskAiScreenOpen } from '../../navigation/askAiNavigation';
import { WEB_TOP_NAV_HEIGHT } from '../../layout/responsive';
import { useTheme } from '../../theme';
import { PREMIUM } from '../premium/premiumStyles';

type TabRoute = 'Home' | 'Practice' | 'CurrentAffairs' | 'Profile';

const TAB_ROUTES: TabRoute[] = ['Home', 'Practice', 'CurrentAffairs', 'Profile'];

const TAB_LABEL_KEYS: Record<TabRoute, string> = {
  Home: 'home',
  Practice: 'practice',
  CurrentAffairs: 'currentAffairs',
  Profile: 'profile',
};

type WebTopNavProps = BottomTabBarProps;

/** Desktop web — horizontal top navigation instead of mobile bottom tabs. */
export function WebTopNav({ state, navigation }: WebTopNavProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation('navigation');
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const aiFocused = isAskAiScreenOpen(navigation);

  return (
    <View style={styles.shell}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <SopaanLogo size={34} />
          <Text style={styles.brandText}>SOPAAN</Text>
        </View>

        <View style={styles.tabs}>
          {TAB_ROUTES.map((routeName) => {
            const route = state.routes.find((r) => r.name === routeName);
            if (!route) return null;

            const index = state.routes.findIndex((r) => r.name === routeName);
            const isFocused = state.index === index && !aiFocused;

            return (
              <Pressable
                key={routeName}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                onPress={() => navigation.navigate(route.name)}
                style={({ pressed }) => [
                  styles.tab,
                  isFocused && styles.tabActive,
                  pressed && styles.tabPressed,
                ]}
              >
                <Text {...denseTextProps} style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {t(TAB_LABEL_KEYS[routeName])}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: aiFocused }}
            onPress={() => navigateToAskAI(navigation)}
            style={({ pressed }) => [
              styles.aiTab,
              aiFocused && styles.aiTabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Sparkles size={15} color={aiFocused ? PREMIUM.goldDeep : '#FFFFFF'} />
            <Text {...denseTextProps} style={[styles.tabLabel, aiFocused && styles.tabLabelAi]}>
              {t('askAi')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], safeTop: number) {
  return StyleSheet.create({
    shell: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      paddingTop: safeTop,
      backgroundColor: PREMIUM.accent,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
      boxShadow: '0 8px 24px rgba(26,31,59,0.18)' as unknown as undefined,
    },
    inner: {
      height: WEB_TOP_NAV_HEIGHT,
      maxWidth: 1280,
      width: '100%',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minWidth: 140,
    },
    brandText: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 18,
      letterSpacing: 2,
      color: '#FFFFFF',
    },
    tabs: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
    },
    tabActive: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    tabPressed: { opacity: 0.9 },
    tabLabel: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.72)',
    },
    tabLabelActive: {
      color: '#FFFFFF',
    },
    aiTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.35)',
      marginLeft: 4,
    },
    aiTabActive: {
      backgroundColor: PREMIUM.goldSoft,
      borderColor: PREMIUM.gold,
    },
    tabLabelAi: {
      color: PREMIUM.goldDeep,
    },
  });
}
