import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { McqSequenceGame } from './McqSequenceGame';
import { useAffairQuizGame } from '../hooks/useDailyRoutine';
import { Button, Text } from '../components';

type AffairQuizGameProps = {
  affairId: string;
  onComplete: (result: import('./completion').GameCompleteResult) => void;
};

type Nav = NativeStackNavigationProp<Record<string, object | undefined>>;

export function AffairQuizGame({ affairId, onComplete }: AffairQuizGameProps) {
  const { t } = useTranslation('app');
  const navigation = useNavigation<Nav>();
  const quizQuery = useAffairQuizGame(affairId);

  if (quizQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.label}>{t('games.affairQuizLoading')}</Text>
      </View>
    );
  }

  if (quizQuery.isError || !quizQuery.data?.questions.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.label}>{t('games.affairQuizLoadFailed')}</Text>
        <View style={styles.actions}>
          <Button
            label={t('games.affairQuizRetry')}
            onPress={() => void quizQuery.refetch()}
          />
          <Button
            label={t('games.affairQuizGoBack')}
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  return (
    <McqSequenceGame
      questions={quizQuery.data.questions}
      label={`📰 ${quizQuery.data.title}`}
      onComplete={onComplete}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  label: {
    textAlign: 'center',
    opacity: 0.8,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
});
