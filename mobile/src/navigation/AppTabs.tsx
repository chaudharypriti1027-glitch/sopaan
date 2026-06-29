import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/TabBar';
import {
  CurrentAffairsScreen,
  HomeScreen,
  PracticeScreen,
} from '../screens/tabs';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '600' },
        lazy: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Practice" component={PracticeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="CurrentAffairs" component={CurrentAffairsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
