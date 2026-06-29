import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '../../components';
import { GamePlayHeader, GameResultCard, GAMES_UI } from '../../components/games';
import {
  CODE_QUESTIONS,
  FLAG_QUESTIONS,
  GRAMMAR_QUESTIONS,
  SCIENCE_QUESTIONS,
  TRIVIA_QUESTIONS,
  WORLD_QUESTIONS,
} from '../../games/banks';
import { CrosswordMiniGame } from '../../games/CrosswordMiniGame';
import { GK_QUESTIONS, MAP_QUESTIONS, getGameById } from '../../games/content';
import { GKBingoGame } from '../../games/GKBingoGame';
import { HistoryLineGame } from '../../games/HistoryLineGame';
import { LogicPuzzleGame } from '../../games/LogicPuzzleGame';
import { MathBlitzGame } from '../../games/MathBlitzGame';
import { McqSequenceGame } from '../../games/McqSequenceGame';
import { McqTimedGame } from '../../games/McqTimedGame';
import { MemoryMatchGame } from '../../games/MemoryMatchGame';
import { SpellingBeeGame } from '../../games/SpellingBeeGame';
import { StoryBuilderGame } from '../../games/StoryBuilderGame';
import { WordChainGame } from '../../games/WordChainGame';
import { WordScrambleGame } from '../../games/WordScrambleGame';
import { useCompleteGame } from '../../hooks';
import type { GameId } from '../../games/types';
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

  const game = getGameById(gameId);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsAwarded, setCoinsAwarded] = useState<number | null>(null);
  const [rewardFailed, setRewardFailed] = useState(false);

  const handleComplete = useCallback(
    (finalScore: number) => {
      setScore(finalScore);
      setFinished(true);
      setRewardFailed(false);
      setCoinsAwarded(null);

      completeGame.mutate(
        { gameId, score: finalScore },
        {
          onSuccess: (data) => {
            setCoinsAwarded(data.coinsAwarded);
          },
          onError: () => {
            setRewardFailed(true);
          },
        },
      );
    },
    [completeGame, gameId],
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

  const renderGame = (id: GameId) => {
    switch (id) {
      case 'memory-match':
        return <MemoryMatchGame key={sessionKey} onComplete={handleComplete} />;
      case 'word-scramble':
        return <WordScrambleGame key={sessionKey} onComplete={handleComplete} />;
      case 'gk-bingo':
        return <GKBingoGame key={sessionKey} onComplete={handleComplete} />;
      case 'rapid-fire':
        return (
          <McqTimedGame
            key={sessionKey}
            questions={GK_QUESTIONS}
            durationSec={60}
            label="⚡ RAPID FIRE"
            onComplete={handleComplete}
          />
        );
      case 'crossword':
        return <CrosswordMiniGame key={sessionKey} onComplete={handleComplete} />;
      case 'map-quiz':
        return (
          <McqTimedGame
            key={sessionKey}
            questions={MAP_QUESTIONS}
            durationSec={45}
            label="🗺️ MAP QUIZ"
            onComplete={handleComplete}
          />
        );
      case 'math-blitz':
        return (
          <MathBlitzGame key={sessionKey} rounds={10} durationSec={120} onComplete={handleComplete} />
        );
      case 'number-ninja':
        return (
          <MathBlitzGame key={sessionKey} rounds={8} durationSec={60} onComplete={handleComplete} />
        );
      case 'grammar-fix':
        return (
          <McqSequenceGame
            key={sessionKey}
            questions={GRAMMAR_QUESTIONS}
            label="✏️ Grammar"
            onComplete={handleComplete}
          />
        );
      case 'science-lab':
        return (
          <McqSequenceGame
            key={sessionKey}
            questions={SCIENCE_QUESTIONS}
            onComplete={handleComplete}
          />
        );
      case 'history-line':
        return <HistoryLineGame key={sessionKey} onComplete={handleComplete} />;
      case 'spelling-bee':
        return <SpellingBeeGame key={sessionKey} onComplete={handleComplete} />;
      case 'flag-master':
        return (
          <McqSequenceGame key={sessionKey} questions={FLAG_QUESTIONS} onComplete={handleComplete} />
        );
      case 'logic-puzzle':
        return <LogicPuzzleGame key={sessionKey} onComplete={handleComplete} />;
      case 'word-chain':
        return <WordChainGame key={sessionKey} onComplete={handleComplete} />;
      case 'world-quiz':
        return (
          <McqSequenceGame
            key={sessionKey}
            questions={WORLD_QUESTIONS}
            label="🌍 World"
            onComplete={handleComplete}
          />
        );
      case 'trivia-blitz':
        return (
          <McqTimedGame
            key={sessionKey}
            questions={TRIVIA_QUESTIONS}
            durationSec={75}
            label="🎲 TRIVIA BLITZ"
            onComplete={handleComplete}
          />
        );
      case 'code-breaker':
        return (
          <McqSequenceGame
            key={sessionKey}
            questions={CODE_QUESTIONS}
            label="💻 Code Breaker"
            onComplete={handleComplete}
          />
        );
      case 'story-builder':
        return <StoryBuilderGame key={sessionKey} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <GamePlayHeader
        title={game.title}
        subtitle={game.description}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.playContent}
      >
        {renderGame(gameId)}
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
    },
    playContent: {
      paddingHorizontal: 16,
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
