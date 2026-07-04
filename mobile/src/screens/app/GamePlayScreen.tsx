import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '../../components';
import { GamePlayHeader, GameResultCard, GamesPlayCard, GAMES_UI } from '../../components/games';
import { getGameById } from '../../games/content';
import { renderGameById } from '../../games/registry';
import { useCompleteGame, useGameProgress } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';

type GamePlayRoute = RouteProp<MainStackParamList, 'GamePlay'>;
type GamePlayNav = NativeStackNavigationProp<MainStackParamList, 'GamePlay'>;

export function GamePlayScreen() {
  const route = useRoute<GamePlayRoute>();
  const navigation = useNavigation<GamePlayNav>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);
  const { gameId, sessionId = 0 } = route.params;
  const completeGame = useCompleteGame();
  const { recordComplete } = useGameProgress();

  const game = getGameById(gameId);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsAwarded, setCoinsAwarded] = useState<number | null>(null);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [rewardFailed, setRewardFailed] = useState(false);

  const handleComplete = useCallback(
    (finalScore: number) => {
      setScore(finalScore);
      setFinished(true);
      setRewardFailed(false);
      setCoinsAwarded(null);
      setXpAwarded(null);
      void recordComplete(gameId, finalScore);

      completeGame.mutate(
        { gameId, score: finalScore },
        {
          onSuccess: (data) => {
            setCoinsAwarded(data.coinsAwarded);
            setXpAwarded(data.xpAwarded);
          },
          onError: () => {
            setRewardFailed(true);
          },
        },
      );
    },
    [completeGame, gameId, recordComplete],
  );

  const playAgain = () => {
    navigation.replace('GamePlay', { gameId, sessionId: Date.now() });
  };

  const retryRewards = () => {
    completeGame.mutate(
      { gameId, score },
      {
        onSuccess: (data) => {
          setCoinsAwarded(data.coinsAwarded);
          setXpAwarded(data.xpAwarded);
          setRewardFailed(false);
        },
      },
    );
  };

  if (!game) {
    return (
      <View style={styles.root}>
        <GamePlayHeader title={t('games.title')} onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text>{t('games.notFound')}</Text>
          <Button label={t('quiz.goBack')} onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const sessionKey = `${gameId}-${sessionId}`;
  const localCoinsEstimate = Math.max(5, Math.round((score / 100) * game.coinReward));

  if (finished) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.resultContent}
        showsVerticalScrollIndicator={false}
      >
        <GameResultCard
          title={t('games.resultTitle')}
          subtitle={t('games.resultSubtitle', { title: game.title })}
          score={score}
          scoreLabel={t('games.score')}
          coinsLabel={t('games.coins')}
          coinsValue={coinsAwarded ?? (rewardFailed ? localCoinsEstimate : 0)}
          xpLabel={t('games.xp')}
          xpValue={xpAwarded ?? undefined}
          coinsLoading={completeGame.isPending && coinsAwarded === null && !rewardFailed}
          rewardHint={rewardFailed ? t('games.rewardHint') : undefined}
          playAgainLabel={t('games.playAgain')}
          allGamesLabel={t('games.allGames')}
          retryLabel={t('games.retrySync')}
          showRetry={rewardFailed}
          retryLoading={completeGame.isPending}
          onPlayAgain={playAgain}
          onAllGames={() => navigation.navigate('Games')}
          onRetry={retryRewards}
        />
      </ScrollView>
    );
  }

  const gameView = renderGameById(gameId, { sessionKey, onComplete: handleComplete });

  return (
    <View style={styles.root}>
      <GamePlayHeader
        title={game.title}
        subtitle={game.description}
        coinReward={game.coinReward}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.playContent}
      >
        <GamesPlayCard>
          {gameView ?? (
            <View style={styles.centered}>
              <Text>{t('games.notFound')}</Text>
            </View>
          )}
        </GamesPlayCard>
      </ScrollView>
    </View>
  );
}

function createStyles(bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: GAMES_UI.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      minHeight: 200,
    },
    playContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24 + bottomInset,
      gap: 12,
    },
    resultContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 24 + bottomInset,
    },
  });
}
