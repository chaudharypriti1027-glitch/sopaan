import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  GAMES_UI,
  GameTile,
  GamesCategoryChips,
  GamesDailyChallenge,
  GamesEmptyState,
  GamesHero,
  GamesSearchBar,
  GamesSectionHeader,
} from '../../components/games';
import { HomeAnimatedSection } from '../../components/home/HomeAnimatedSection';
import { GAME_CATALOG, getGameById } from '../../games/content';
import type { GameCategory, GameId } from '../../games/types';
import { useGameProgress, useMe } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';

type GamesNav = NativeStackNavigationProp<MainStackParamList, 'Games'>;

const CATEGORY_OPTIONS: { key: GameCategory; labelKey: string }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'language', labelKey: 'language' },
  { key: 'gk', labelKey: 'gk' },
  { key: 'geography', labelKey: 'geography' },
  { key: 'logic', labelKey: 'logic' },
  { key: 'math', labelKey: 'math' },
  { key: 'science', labelKey: 'science' },
  { key: 'history', labelKey: 'history' },
];

async function lightImpact() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Unavailable on web / some simulators.
  }
}

export function GamesScreen() {
  const navigation = useNavigation<GamesNav>();
  const { t } = useTranslation('app');
  const meQuery = useMe();
  const {
    refresh,
    gamesDone,
    dailyChallengeGameId,
    dailyProgress,
    lastPlayedGameId,
    bestScores,
  } = useGameProgress();
  const styles = useMemo(() => createStyles(), []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GameCategory>('all');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const coins = meQuery.data?.coins ?? 0;
  const streak = meQuery.data?.streak ?? 0;
  const rank = meQuery.data?.rank;

  const openGame = useCallback(
    (gameId: GameId) => {
      void lightImpact();
      navigation.navigate('GamePlay', { gameId });
    },
    [navigation],
  );

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    return GAME_CATALOG.filter((game) => {
      const matchesCategory = category === 'all' || game.category.includes(category);
      const matchesSearch =
        !query ||
        game.title.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const dailyGame = getGameById(dailyChallengeGameId) ?? GAME_CATALOG[0];
  const continueGame =
    (lastPlayedGameId ? getGameById(lastPlayedGameId) : null) ?? dailyGame;

  const categoryOptions = CATEGORY_OPTIONS.map((item) => ({
    key: item.key,
    label: t(`games.categories.${item.labelKey}`),
  }));

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('games.greetingMorning');
    if (hour < 17) return t('games.greetingAfternoon');
    return t('games.greetingEvening');
  }, [t]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategory('all');
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), meQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [meQuery, refresh]);

  let sectionIndex = 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={GAMES_UI.accent}
            colors={[GAMES_UI.accent]}
          />
        }
      >
        <GamesHero
          greeting={greeting}
          screenTitle={t('games.title')}
          coins={coins}
          streak={streak}
          gamesDone={gamesDone}
          rank={rank}
          title={t('games.heroTitle')}
          subtitle={t('games.heroSubtitle')}
          badgeLabel={t('games.coinBadge', { coins })}
          streakLabel={t('games.streakStat')}
          gamesDoneLabel={t('games.gamesDone')}
          rankLabel={t('games.rankStat')}
          onBack={() => navigation.goBack()}
          onRankPress={() => navigation.navigate('Leaderboard')}
        />

        <View style={styles.dailyWrap}>
          <HomeAnimatedSection index={sectionIndex++}>
            <GamesDailyChallenge
              title={t('games.dailyChallenge')}
              subtitle={t('games.dailyChallengeSub', { title: dailyGame.title })}
              cta={dailyProgress >= 100 ? t('games.dailyDone') : t('games.go')}
              progress={dailyProgress}
              onPress={() => openGame(dailyChallengeGameId)}
            />
          </HomeAnimatedSection>
        </View>

        <View style={styles.section}>
          <HomeAnimatedSection index={sectionIndex++}>
            <GamesSectionHeader title={t('games.continuePlaying')} compact />
            <GameTile
              game={continueGame}
              featured
              bestScore={bestScores[continueGame.id]}
              playLabel={t('games.playNow')}
              onPress={() => openGame(continueGame.id)}
            />
          </HomeAnimatedSection>
        </View>

        <View style={styles.section}>
          <HomeAnimatedSection index={sectionIndex++}>
            <GamesSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('games.searchPlaceholder', { count: GAME_CATALOG.length })}
            />

            <GamesCategoryChips
              options={categoryOptions}
              active={category}
              onChange={setCategory}
            />

            <GamesSectionHeader
              title={t('games.popular')}
              action={t('games.seeAll', { count: filteredGames.length })}
            />
          </HomeAnimatedSection>

          <View style={styles.grid}>
            {filteredGames.map((game, index) => (
              <View key={game.id} style={styles.gridItem}>
                <HomeAnimatedSection index={sectionIndex + Math.min(index, 4)}>
                  <GameTile
                    game={game}
                    bestScore={bestScores[game.id]}
                    onPress={() => openGame(game.id)}
                  />
                </HomeAnimatedSection>
              </View>
            ))}
          </View>

          {filteredGames.length === 0 ? (
            <GamesEmptyState
              title={t('games.emptyTitle')}
              hint={t('games.emptyHint')}
              actionLabel={t('games.clearFilters')}
              onAction={clearFilters}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: GAMES_UI.bg,
    },
    content: {
      paddingBottom: GAMES_UI.tabBottomPad,
    },
    dailyWrap: {
      marginTop: GAMES_UI.forYouLift,
      paddingHorizontal: 16,
    },
    section: {
      paddingHorizontal: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      paddingBottom: 16,
    },
    gridItem: {
      width: '48%',
    },
  });
}
