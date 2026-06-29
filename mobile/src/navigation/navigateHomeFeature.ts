import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppTabParamList, MainStackParamList } from './types';
import type { HomeFeatureLink } from './homeFeatureConfig';

export type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function navigateHomeFeature(navigation: HomeNav, link: HomeFeatureLink) {
  if (link.navigateVia === 'tab') {
    navigation.navigate(link.route as keyof AppTabParamList);
    return;
  }

  navigation.getParent<NativeStackNavigationProp<MainStackParamList>>()?.navigate(
    link.route as never,
  );
}
