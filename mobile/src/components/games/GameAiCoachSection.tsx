import type { GameReviewItem } from '../../api/games';
import { Card, Text } from '../';
import { ResultCoachPanel } from '../result/ResultCoachPanel';
import { ResultExplanationBlock } from '../result/ResultExplanationBlock';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GAMES_UI } from './gamesTheme';

type GameAiCoachSectionProps = {
  coaching: {
    feedback: string;
    weakTopics: string[];
    actions: string[];
  };
  review: GameReviewItem[];
  onPracticePress: () => void;
};

export function GameAiCoachSection({ coaching, review, onPracticePress }: GameAiCoachSectionProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <ResultCoachPanel
        feedback={coaching.feedback}
        weakTopics={coaching.weakTopics}
        actions={coaching.actions}
        onPracticePress={onPracticePress}
      />

      {review.length > 0 ? (
        <View style={styles.reviewBlock}>
          <Text style={styles.reviewTitle}>{t('games.aiReviewTitle')}</Text>
          {review.map((item) => (
            <Card key={item.questionId} style={styles.reviewCard}>
              <Text style={styles.reviewPrompt}>{item.prompt}</Text>
              {item.explanation ? (
                <ResultExplanationBlock
                  explanation={item.explanation}
                  selectedKey={item.selected ?? undefined}
                  correctKey={item.correctAnswer ?? undefined}
                  wasCorrect={item.correct}
                  solutionLabel={t('result.solutionLabel')}
                  yourAnswerLabel={t('result.yourAnswer')}
                  correctLabel={t('result.correctStatus')}
                  wrongLabel={t('result.wrongStatus')}
                  correctAnswerLabel={t('result.correctAnswer')}
                  formulaLabel={t('askAi.formula')}
                  answerLabel={t('askAi.answerLabel')}
                  explanationLabel={t('askAi.explanationLabel')}
                  tipLabel={t('askAi.tipLabel')}
                />
              ) : item.correctAnswer ? (
                <Text style={styles.fallback}>
                  {t('result.correctAnswer')}: {item.correctAnswer}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      gap: 16,
      marginTop: 18,
    },
    reviewBlock: {
      gap: 12,
    },
    reviewTitle: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: GAMES_UI.muted,
    },
    reviewCard: {
      gap: 10,
    },
    reviewPrompt: {
      fontSize: 14,
      fontWeight: '700',
      color: GAMES_UI.ink,
      lineHeight: 20,
    },
    fallback: {
      fontSize: 13,
      fontWeight: '600',
      color: GAMES_UI.muted,
    },
  });
}
