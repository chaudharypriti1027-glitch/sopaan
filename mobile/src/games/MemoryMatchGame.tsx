import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { GAMES_UI } from './gamesTheme';
import { MEMORY_PAIRS, shuffle } from './content';

type CardCell = {
  id: string;
  pairId: string;
  label: string;
  kind: 'term' | 'meaning';
};

type MemoryMatchGameProps = {
  onComplete: (score: number) => void;
};

function buildDeck(): CardCell[] {
  const pairs = shuffle(MEMORY_PAIRS).slice(0, 6);
  const cells: CardCell[] = [];
  pairs.forEach((pair) => {
    cells.push({
      id: `${pair.id}-t`,
      pairId: pair.id,
      label: pair.term,
      kind: 'term',
    });
    cells.push({
      id: `${pair.id}-m`,
      pairId: pair.id,
      label: pair.meaning,
      kind: 'meaning',
    });
  });
  return shuffle(cells);
}

export function MemoryMatchGame({ onComplete }: MemoryMatchGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [deck] = useState(buildDeck);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);

  const handleFlip = useCallback(
    (cell: CardCell) => {
      if (lock || matched.has(cell.pairId) || flipped.includes(cell.id)) {
        return;
      }

      const next = [...flipped, cell.id];
      setFlipped(next);

      if (next.length === 2) {
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        const [a, b] = next.map((id) => deck.find((c) => c.id === id)!);
        if (a.pairId === b.pairId) {
          const nextMatched = new Set(matched);
          nextMatched.add(a.pairId);
          setMatched(nextMatched);
          setFlipped([]);
          if (nextMatched.size === 6) {
            onComplete(Math.max(10, 100 - nextMoves * 3));
          }
        } else {
          setLock(true);
          setTimeout(() => {
            setFlipped([]);
            setLock(false);
          }, 800);
        }
      }
    },
    [deck, flipped, lock, matched, moves, onComplete],
  );

  return (
    <View style={styles.root}>
      <View style={styles.stats}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{moves}</Text>
          <Text style={styles.statLabel}>Moves</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{matched.size}/6</Text>
          <Text style={styles.statLabel}>Matched</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {deck.map((cell) => {
          const isOpen = flipped.includes(cell.id) || matched.has(cell.pairId);
          return (
            <Pressable
              key={cell.id}
              accessibilityRole="button"
              onPress={() => handleFlip(cell)}
              style={[styles.cell, isOpen && styles.cellOpen]}
            >
              <Text style={[styles.cellText, isOpen && styles.cellTextOpen]} numberOfLines={3}>
                {isOpen ? cell.label : '?'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      gap: 16,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    statChip: {
      alignItems: 'center',
      backgroundColor: GAMES_UI.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      paddingHorizontal: 20,
      paddingVertical: 10,
      minWidth: 100,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '900',
      color: GAMES_UI.text,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: GAMES_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 2,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'space-between',
    },
    cell: {
      width: '31%',
      aspectRatio: 0.85,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      backgroundColor: GAMES_UI.card2,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
    },
    cellOpen: {
      backgroundColor: GAMES_UI.accent,
      borderColor: GAMES_UI.accent,
    },
    cellText: {
      fontSize: 22,
      fontWeight: '900',
      color: GAMES_UI.muted,
      textAlign: 'center',
    },
    cellTextOpen: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
  });
}
