import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GAMES_UI,
  GameTile,
  GamesCategoryChips,
  GamesDailyChallenge,
  GamesHero,
  GamesSearchBar,
  GamesSectionHeader,
} from '../../components/games';
import { Text } from '../../components';
import { GAME_CATALOG } from '../../games/content';
import type { GameCategory, GameId } from '../../games/types';
import { useMe } from '../../hooks';
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

export function GamesScreen() {
  const navigation = useNavigation<GamesNav>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('app');
  const meQuery = useMe();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GameCategory>('all');

  const coins = meQuery.data?.coins ?? 0;
  const streak = meQuery.data?.streak ?? 0;

  const openGame = (gameId: GameId) => {
    navigation.navigate('GamePlay', { gameId });
  };

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

  const featuredGame = GAME_CATALOG[0];
  const categoryOptions = CATEGORY_OPTIONS.map((item) => ({
    key: item.key,
    label: t(`games.categories.${item.labelKey}`),
  }));

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 4 }]}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{t('games.greeting')}</Text>
            <Text style={styles.screenTitle}>{t('games.title')}</Text>
          </View>
          <View style={styles.coinPill}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinValue}>{coins}</Text>
          </View>
        </View>

        <GamesHero
          coins={coins}
          streak={streak}
          gamesDone={0}
          title={t('games.heroTitle')}
          subtitle={t('games.heroSubtitle')}
          badgeLabel={t('games.coinBadge', { coins })}
          streakLabel={t('games.streakStat')}
          gamesDoneLabel={t('games.gamesDone')}
          rankLabel={t('games.rankStat')}
        />

        <GamesDailyChallenge
          title={t('games.dailyChallenge')}
          subtitle={t('games.dailyChallengeSub')}
          cta={t('games.go')}
          progress={35}
          onPress={() => openGame('rapid-fire')}
        />

        <GamesSectionHeader title={t('games.continuePlaying')} />
        <View style={styles.featuredWrap}>
          <GameTile
            game={featuredGame}
            featured
            onPress={() => openGame(featuredGame.id)}
          />
        </View>

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
          action={t('games.seeAll', { count: GAME_CATALOG.length })}
        />

        <View style={styles.grid}>
          {filteredGames.map((game) => (
            <GameTile key={game.id} game={game} onPress={() => openGame(game.id)} />
          ))}
        </View>

        {filteredGames.length === 0 ? (
          <Text style={styles.empty}>{t('games.noResults')}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(bottomInset: number) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: GAMES_UI.bg,
    },
    content: {
      paddingBottom: 24 + bottomInset,
      gap: 4,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    greeting: {
      fontSize: 12,
      fontWeight: '600',
      color: GAMES_UI.muted,
    },
    screenTitle: {
      fontSize: 19,
      fontWeight: '900',
      color: GAMES_UI.text,
      marginTop: 2,
    },
    coinPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: GAMES_UI.border,
      shadowColor: GAMES_UI.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    coinEmoji: { fontSize: 14 },
    coinValue: {
      fontSize: 14,
      fontWeight: '800',
      color: GAMES_UI.gold,
    },
    featuredWrap: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    empty: {
      textAlign: 'center',
      color: GAMES_UI.muted,
      fontSize: 14,
      paddingVertical: 24,
    },
  });
}
