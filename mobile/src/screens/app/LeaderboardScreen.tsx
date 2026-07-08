import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LeaderboardHero,
  LeaderboardPodium,
  LeaderboardRankList,
  LeaderboardYouCard,
  LEADERBOARD_UI,
  type LeaderboardPeriod,
} from '../../components/leaderboard';
import { HomeAnimatedSection } from '../../components/home/HomeAnimatedSection';
import { QueryStateView, Screen } from '../../components';
import { useAuth } from '../../auth';
import { useLeaderboard, useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';

export function LeaderboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'Leaderboard'>>();
  const styles = useMemo(() => createStyles(), []);
  const routedTestId = useRef(false);
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');

  useEffect(() => {
    const testId = route.params?.testId;
    if (!testId || routedTestId.current) {
      return;
    }

    routedTestId.current = true;
    navigation.navigate('TestSeries', { testId });
  }, [navigation, route.params?.testId]);

  const leaderboardQuery = useLeaderboard({ limit: 50, period });
  const data = leaderboardQuery.data;
  const items = useMemo(() => data?.items ?? [], [data]);
  const podium = items.slice(0, 3);
  const you = data?.you;
  const hasData = Boolean(data) || items.length > 0;

  const handleRefresh = useCallback(() => {
    void leaderboardQuery.refetch();
  }, [leaderboardQuery]);

  const handleTakeMock = useCallback(() => {
    navigation.navigate('TestSeries');
  }, [navigation]);

  return (
    <Screen
      scroll
      padded={false}
      style={styles.screen}
      contentContainerStyle={styles.content}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={leaderboardQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={LEADERBOARD_UI.gold}
            colors={[LEADERBOARD_UI.gold]}
          />
        ),
      }}
    >
      <LeaderboardHero
        meta={data?.meta}
        period={period}
        onPeriodChange={setPeriod}
        onBack={() => navigation.goBack()}
      />

      <QueryStateView
        isLoading={leaderboardQuery.isLoading}
        isError={leaderboardQuery.isError}
        isFetching={leaderboardQuery.isFetching}
        isOffline={isOffline}
        hasData={hasData}
        onRetry={() => void leaderboardQuery.refetch()}
      >
        <View style={styles.body}>
          <View style={styles.youWrap}>
            <HomeAnimatedSection index={0}>
              <LeaderboardYouCard you={you} onTakeMock={handleTakeMock} />
            </HomeAnimatedSection>
          </View>

          {podium.length >= 3 ? (
            <HomeAnimatedSection index={1}>
              <LeaderboardPodium entries={podium} />
            </HomeAnimatedSection>
          ) : null}

          <HomeAnimatedSection index={2}>
            <LeaderboardRankList
              items={items}
              totalPlayers={data?.meta?.totalPlayers}
              currentUserId={user?.id}
            />
          </HomeAnimatedSection>
        </View>
      </QueryStateView>
    </Screen>
  );
}

function createStyles() {
  return StyleSheet.create({
    screen: { backgroundColor: LEADERBOARD_UI.bg },
    content: { paddingBottom: LEADERBOARD_UI.tabBottomPad },
    body: { paddingHorizontal: 20, zIndex: 5 },
    youWrap: {
      marginTop: LEADERBOARD_UI.forYouLift,
    },
  });
}
