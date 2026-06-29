import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../components';
import { Text } from '../components/Text';
import { WORD_CHAIN_ROUNDS } from './banks';
import { GAMES_UI } from './gamesTheme';
import { shuffle } from './content';

type WordChainGameProps = {
  onComplete: (score: number) => void;
};

export function WordChainGame({ onComplete }: WordChainGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [rounds] = useState(() => shuffle(WORD_CHAIN_ROUNDS));
  const [index, setIndex] = useState(0);
  const [chain, setChain] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = rounds[index];
  const lastWord = chain.length > 0 ? chain[chain.length - 1] : current.startWord;
  const requiredLetter = lastWord.slice(-1).toUpperCase();

  const submit = () => {
    const word = answer.trim().toUpperCase();
    if (!word.startsWith(requiredLetter)) {
      setFeedback(`Word must start with "${requiredLetter}"`);
      return;
    }
    const valid = current.validWords.map((w) => w.toUpperCase()).includes(word);
    if (!valid) {
      setFeedback(`Try: ${current.validWords.slice(0, 3).join(', ')}`);
      return;
    }

    const nextChain = [...chain, word];
    const nextScore = score + 30;
    setFeedback('Correct!');
    setChain(nextChain);
    setAnswer('');

    setTimeout(() => {
      const next = index + 1;
      if (next >= rounds.length) {
        onComplete(nextScore);
        return;
      }
      setScore(nextScore);
      setIndex(next);
      setChain([]);
      setFeedback(null);
    }, 700);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.progress}>
        Chain {index + 1}/{rounds.length} · Score {score}
      </Text>

      <View style={styles.infoPill}>
        <Text style={styles.infoText}>
          Each new word must start with the last letter of the previous word
        </Text>
      </View>

      <View style={styles.chainBox}>
        <View style={styles.chainWord}>
          <View style={styles.chainNum}>
            <Text style={styles.chainNumText}>1</Text>
          </View>
          <Text style={styles.chainText}>{current.startWord}</Text>
          <Text style={styles.chainLink}>→ {requiredLetter}</Text>
        </View>
        {chain.map((word, i) => (
          <View key={`${word}-${i}`} style={styles.chainWord}>
            <View style={styles.chainNum}>
              <Text style={styles.chainNumText}>{i + 2}</Text>
            </View>
            <Text style={styles.chainText}>{word}</Text>
          </View>
        ))}
      </View>

      <TextInput
        value={answer}
        onChangeText={setAnswer}
        autoCapitalize="characters"
        placeholder={`Type a word starting with ${requiredLetter}...`}
        placeholderTextColor={GAMES_UI.muted}
        style={styles.input}
        onSubmitEditing={submit}
      />

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Button label="Submit ✓" onPress={submit} fullWidth />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: 12 },
    progress: {
      fontSize: 13,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    infoPill: {
      backgroundColor: 'rgba(107,78,255,0.06)',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(107,78,255,0.15)',
    },
    infoText: {
      fontSize: 13,
      color: GAMES_UI.text2,
      fontWeight: '600',
    },
    chainBox: { gap: 8 },
    chainWord: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      padding: 12,
    },
    chainNum: {
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: GAMES_UI.card2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chainNumText: {
      fontSize: 12,
      fontWeight: '900',
      color: GAMES_UI.accent,
    },
    chainText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    chainLink: {
      fontSize: 13,
      fontWeight: '800',
      color: GAMES_UI.gold,
    },
    input: {
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      fontWeight: '600',
      color: GAMES_UI.text,
      backgroundColor: GAMES_UI.card2,
    },
    feedback: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '700',
      color: GAMES_UI.accent,
    },
  });
}
