import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../components';
import { Text } from '../components/Text';
import { HISTORY_SETS } from './banks';
import { GAMES_UI } from './gamesTheme';
import type { HistoryEvent } from './types';
import { shuffle } from './content';

type HistoryLineGameProps = {
  onComplete: (score: number) => void;
};

function isChronological(events: HistoryEvent[]) {
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].year < events[i - 1].year) {
      return false;
    }
  }
  return true;
}

export function HistoryLineGame({ onComplete }: HistoryLineGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [correctOrder] = useState(() => shuffle(HISTORY_SETS)[0]);
  const [events, setEvents] = useState(() => shuffle(correctOrder));
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const move = (from: number, direction: -1 | 1) => {
    if (revealed) {
      return;
    }

    const to = from + direction;
    if (to < 0 || to >= events.length) {
      return;
    }
    const next = [...events];
    [next[from], next[to]] = [next[to], next[from]];
    setEvents(next);
    setChecked(false);
    setFeedback(null);
  };

  const finishWithScore = (score: number) => {
    setTimeout(() => onComplete(score), 800);
  };

  const revealAnswer = () => {
    setRevealed(true);
    setEvents(correctOrder);
    setChecked(true);
    setFeedback('Correct chronological order shown — review and continue.');
    finishWithScore(35);
  };

  const checkOrder = () => {
    if (revealed) {
      return;
    }

    const correct = isChronological(events);
    setChecked(true);
    if (correct) {
      setFeedback('Perfect chronological order!');
      finishWithScore(100);
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= 3) {
      revealAnswer();
      return;
    }

    setFeedback('Not quite — swap events until years go earliest → latest.');
  };

  return (
    <View style={styles.root}>
      <View style={styles.infoPill}>
        <Text style={styles.infoText}>
          📌 Arrange events in chronological order (earliest first)
        </Text>
      </View>

      {events.map((event, index) => (
        <View key={event.id} style={styles.tlItem}>
          <Text style={styles.year}>{event.year}</Text>
          <View style={styles.card}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.detail}>{event.detail}</Text>
            <View style={styles.controls}>
              <Pressable
                accessibilityRole="button"
                onPress={() => move(index, -1)}
                disabled={index === 0 || revealed}
                style={[styles.moveBtn, (index === 0 || revealed) && styles.moveDisabled]}
              >
                <Text style={styles.moveText}>↑</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => move(index, 1)}
                disabled={index === events.length - 1 || revealed}
                style={[
                  styles.moveBtn,
                  (index === events.length - 1 || revealed) && styles.moveDisabled,
                ]}
              >
                <Text style={styles.moveText}>↓</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      {feedback ? (
        <Text style={[styles.feedback, checked && isChronological(events) && styles.feedbackOk]}>
          {feedback}
        </Text>
      ) : null}

      {!revealed ? (
        <View style={styles.actionRow}>
          {attempts >= 2 ? (
            <Button label="Show answer" variant="ghost" onPress={revealAnswer} />
          ) : null}
          <Button label="Check Order →" onPress={checkOrder} fullWidth={attempts < 2} />
        </View>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: 12 },
    infoPill: {
      backgroundColor: 'rgba(249,115,22,0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(249,115,22,0.25)',
      borderRadius: 14,
      padding: 12,
    },
    infoText: {
      fontSize: 13,
      color: GAMES_UI.text2,
      fontWeight: '600',
    },
    tlItem: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    year: {
      fontSize: 13,
      fontWeight: '900',
      color: GAMES_UI.accent,
      width: 44,
      marginTop: 14,
    },
    card: {
      flex: 1,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      padding: 14,
      gap: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    detail: {
      fontSize: 12,
      color: GAMES_UI.muted,
    },
    controls: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    moveBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: GAMES_UI.card2,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moveDisabled: { opacity: 0.35 },
    moveText: {
      fontSize: 16,
      fontWeight: '900',
      color: GAMES_UI.text,
    },
    feedback: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '700',
      color: GAMES_UI.red,
    },
    feedbackOk: {
      color: GAMES_UI.green,
    },
    actionRow: {
      gap: 10,
    },
  });
}
