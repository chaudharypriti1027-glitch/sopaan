import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { WebTopNav } from '../components/layout/WebTopNav';
import { useResponsiveLayout, WEB_TOP_NAV_HEIGHT } from '../layout/responsive';
import {
  CurrentAffairsScreen,
  HomeScreen,
  PracticeScreen,
} from '../screens/tabs';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  const { isWideWeb } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const webTopChrome = isWideWeb ? WEB_TOP_NAV_HEIGHT + insets.top : 0;

  return (
    <View style={styles.root}>
      <Tab.Navigator
        tabBar={(props) => (isWideWeb ? <WebTopNav {...props} /> : <TabBar {...props} />)}
        screenOptions={{
          headerShown: true,
          headerTitleStyle: { fontWeight: '600' },
          lazy: true,
          sceneStyle: isWideWeb
            ? {
                paddingTop: webTopChrome,
                maxWidth: 1280,
                width: '100%',
                alignSelf: 'center',
              }
            : undefined,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Practice" component={PracticeScreen} options={{ headerShown: false }} />
        <Tab.Screen
          name="CurrentAffairs"
          component={CurrentAffairsScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? { width: '100%' as const } : null),
  },
});
