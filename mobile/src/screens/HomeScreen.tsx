import { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Button, Card, Text } from '../components';
import {
  HomeFeedContent,
  HomeHeroScroll,
  HomeOfflineBanner,
  HomeSkeleton,
  HOME_UI,
} from '../components/home';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { navigateHomeDeeplink } from '../navigation/homeDeeplink';
import { navigateHomeFeature } from '../navigation/navigateHomeFeature';
import type { HomeFeatureLink } from '../navigation/homeFeatureConfig';
import type { AppTabParamList, MainStackParamList } from '../navigation/types';
import { useScreenPerf } from '../perf';
import { useTheme } from '../theme';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

async function lightImpact() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Unavailable on web / some simulators.
  }
}

export function HomeScreen() {
  const { t } = useTranslation(['app', 'common']);
  const navigation = useNavigation<HomeNav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(), []);

  const { data: feed, isLoading, isError, isOffline, refetch, isRefetching } = useHomeFeed();

  useScreenPerf('Home', {
    isContentReady: Boolean(feed ?? isError),
    isInteractive: Boolean(feed) || isError,
  });

  const handleDeeplink = useCallback(
    (url: string) => {
      navigateHomeDeeplink(navigation, url);
    },
    [navigation],
  );

  const handleDeeplinkWithHaptic = useCallback(
    (url: string) => {
      void lightImpact();
      handleDeeplink(url);
    },
    [handleDeeplink],
  );

  const handleTestPress = useCallback(
    (testId: string) => {
      handleDeeplink(`/stack/Quiz/${testId}`);
    },
    [handleDeeplink],
  );

  const handleAffairPress = useCallback(
    (affairId: string) => {
      navigation.navigate('CurrentAffairs', { affairId });
    },
    [navigation],
  );

  const handleFeaturePress = useCallback(
    (link: HomeFeatureLink) => {
      void lightImpact();
      navigateHomeFeature(navigation, link);
    },
    [navigation],
  );

  const handleLeaguePress = useCallback(() => {
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>()?.navigate('Leaderboard');
  }, [navigation]);

  const handleNotificationsPress = useCallback(() => {
    handleDeeplink('/stack/Notifications');
  }, [handleDeeplink]);

  const onRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch {
      // isError surfaces on the hook.
    }
  }, [refetch]);

  if (isLoading && !feed) {
    return <HomeSkeleton />;
  }

  if (isError && !feed) {
    return (
      <View style={styles.safe}>
        <View style={styles.errorWrap}>
          <Card style={styles.errorCard}>
            <Text variant="bodyMedium">{t('app:home.loadError')}</Text>
            <Button label={t('common:retry')} onPress={() => void refetch()} fullWidth />
          </Card>
        </View>
      </View>
    );
  }

  if (!feed) {
    return null;
  }

  return (
    <View style={styles.safe}>
      {isOffline ? <HomeOfflineBanner /> : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        testID="home-feed-scroll"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.brand.primary}
            colors={[theme.colors.brand.primary]}
          />
        }
      >
        <HomeHeroScroll
          greeting={feed.greeting}
          streak={feed.streak}
          rank={feed.rank}
          countdown={feed.countdown ?? undefined}
          dailyChallenge={feed.dailyChallenge}
          onNotificationsPress={handleNotificationsPress}
          onGoalPress={() => handleDeeplink('/stack/Readiness')}
          onRankCtaPress={() => handleDeeplink('/tabs/Practice')}
        />

        <HomeFeedContent
          feed={feed}
          navigation={navigation}
          onDeeplink={handleDeeplink}
          onDeeplinkWithHaptic={handleDeeplinkWithHaptic}
          onTestPress={handleTestPress}
          onAffairPress={handleAffairPress}
          onLeaguePress={handleLeaguePress}
          onFeaturePress={handleFeaturePress}
        />
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: HOME_UI.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: HOME_UI.tabBottomPad,
    },
    errorWrap: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    errorCard: {
      gap: 16,
      alignItems: 'stretch',
    },
  });
}
