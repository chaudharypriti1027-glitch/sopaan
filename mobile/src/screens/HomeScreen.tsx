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
  HomeFeedShell,
  HomeHeroScroll,
  HomeLiveNowBanner,
  HomeOfflineBanner,
  HomeSkeleton,
  HomeTopBanner,
  HOME_UI,
} from '../components/home';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { useHomeBanner } from '../hooks/useHomeBanner';
import { useLiveClasses } from '../hooks';
import { useHomeAvatar } from '../components/profile/useHomeAvatar';
import { navigateHomeDeeplink } from '../navigation/homeDeeplink';
import { navigateHomeFeature } from '../navigation/navigateHomeFeature';
import type { HomeFeatureLink } from '../navigation/homeFeatureConfig';
import type { AppTabParamList, MainStackParamList } from '../navigation/types';
import { useScreenPerf } from '../perf';

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
  return <HomeStudentScreen />;
}

function HomeStudentScreen() {
  const { t } = useTranslation(['app', 'common']);
  const navigation = useNavigation<HomeNav>();
  const styles = useMemo(() => createStyles(), []);

  const { data: feed, isLoading, isError, isOffline, refetch, isRefetching } = useHomeFeed();
  const { data: banner } = useHomeBanner();
  const { data: liveClasses, refetch: refetchLiveClasses } = useLiveClasses();
  const liveNow = liveClasses?.liveNow;
  const { display: homeAvatarDisplay } = useHomeAvatar(
    feed?.greeting ?? { name: '', message: '', dateLabel: '', unreadCount: 0 },
  );

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

  const handleAvatarPress = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    try {
      await Promise.all([refetch(), refetchLiveClasses()]);
    } catch {
      // isError surfaces on the hook.
    }
  }, [refetch, refetchLiveClasses]);

  const handleJoinLive = useCallback(() => {
    if (!liveNow) return;
    void lightImpact();
    if (liveClasses?.streamingConfigured === false) {
      return;
    }
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>()?.navigate('LiveClassViewer', {
      liveClassId: liveNow.id,
    });
  }, [liveClasses?.streamingConfigured, liveNow, navigation]);

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
            tintColor={HOME_UI.gold}
            colors={[HOME_UI.gold]}
          />
        }
      >
        <HomeHeroScroll
          greeting={feed.greeting}
          avatarDisplay={homeAvatarDisplay}
          streak={feed.streak}
          rank={feed.rank}
          countdown={feed.countdown ?? undefined}
          dailyChallenge={feed.dailyChallenge}
          studyActive={feed.continue.some((item) => item.progressPct >= 10)}
          onNotificationsPress={handleNotificationsPress}
          onAvatarPress={handleAvatarPress}
          onGoalPress={() => handleDeeplink('/stack/Readiness')}
          onRankCtaPress={() => handleDeeplink('/tabs/Practice')}
        />

        {liveNow && liveClasses?.streamingConfigured !== false ? (
          <HomeLiveNowBanner liveClass={liveNow} onPress={handleJoinLive} />
        ) : null}

        <HomeFeedShell compactTop={Boolean(liveNow && liveClasses?.streamingConfigured !== false)}>
          {banner ? (
            <HomeTopBanner banner={banner} onPress={handleDeeplinkWithHaptic} />
          ) : null}
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
        </HomeFeedShell>
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
