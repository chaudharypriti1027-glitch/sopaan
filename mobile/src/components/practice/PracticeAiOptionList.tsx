import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PracticeSuggestion } from '../../api/ai';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { PracticeChip } from './PracticeChip';
import { platformShadow } from '../../utils/platformShadow';
import { practiceFadeInDown } from './practiceMotion';

type PracticeAiOptionListProps = {
  title: string;
  fetchLabel: string;
  loadingLabel: string;
  useLabel: string;
  emptyHint: string;
  difficultyLabels: Record<string, string>;
  modeStandardLabel: string;
  modeAdaptiveLabel: string;
  countLabel: (count: number) => string;
  suggestions: PracticeSuggestion[];
  loading: boolean;
  onFetch: () => void;
  onSelect: (suggestion: PracticeSuggestion) => void;
};

export function PracticeAiOptionList({
  title,
  fetchLabel,
  loadingLabel,
  useLabel,
  emptyHint,
  difficultyLabels,
  modeStandardLabel,
  modeAdaptiveLabel,
  countLabel,
  suggestions,
  loading,
  onFetch,
  onSelect,
}: PracticeAiOptionListProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={13} color={PRACTICE_UI.goldBadge} strokeWidth={2.4} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onFetch}
          disabled={loading}
          style={({ pressed }) => [styles.fetchBtn, pressed && styles.fetchPressed, loading && styles.fetchDisabled]}
          testID="practice-ai-suggest-fetch"
        >
          {loading ? (
            <ActivityIndicator size="small" color={PRACTICE_UI.startEnd} />
          ) : (
            <Text style={styles.fetchText}>{fetchLabel}</Text>
          )}
        </Pressable>
      </View>

      {loading && !suggestions.length ? (
        <Animated.View entering={FadeIn.duration(240)}>
          <Text style={styles.hint}>{loadingLabel}</Text>
        </Animated.View>
      ) : null}

      {!loading && !suggestions.length ? (
        <Animated.View entering={FadeIn.duration(240)}>
          <Text style={styles.hint}>{emptyHint}</Text>
        </Animated.View>
      ) : null}

      {suggestions.map((item, index) => (
        <Animated.View key={`${item.subject}-${item.topic}-${item.mode}-${item.count}`} entering={practiceFadeInDown(index, 60)}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelect(item)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          testID="practice-ai-suggestion-card"
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.subject} · {item.topic}
            </Text>
            <Text style={styles.useText}>{useLabel}</Text>
          </View>
          <View style={styles.chips}>
            <PracticeChip
              label={difficultyLabels[item.difficulty] ?? item.difficulty}
              variant="green"
              onLight
            />
            <PracticeChip
              label={item.mode === 'adaptive' ? modeAdaptiveLabel : modeStandardLabel}
              variant="purple"
              onLight
            />
            <PracticeChip label={countLabel(item.count)} variant="amber" onLight />
          </View>
          <Text style={styles.reason} numberOfLines={2}>
            {item.reason}
          </Text>
        </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      gap: 10,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(35,42,77,0.1)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    titleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontSize: 12,
      fontWeight: '800',
      color: PRACTICE_UI.ink,
      letterSpacing: 0.2,
    },
    fetchBtn: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: PRACTICE_UI.statIndigoBg,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.1)',
      minWidth: 88,
      alignItems: 'center',
    },
    fetchPressed: {
      opacity: 0.9,
    },
    fetchDisabled: {
      opacity: 0.7,
    },
    fetchText: {
      fontSize: 11,
      fontWeight: '700',
      color: PRACTICE_UI.startEnd,
    },
    hint: {
      fontSize: 11,
      lineHeight: 16,
      color: PRACTICE_UI.meta,
    },
    card: {
      borderRadius: 14,
      padding: 12,
      gap: 8,
      backgroundColor: '#FAFBFF',
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.08)',
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 2,
        opacity: 0.05,
        radius: 8,
        elevation: 1,
      }),
    },
    cardPressed: {
      backgroundColor: '#F4F6FC',
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: '800',
      color: PRACTICE_UI.ink,
    },
    useText: {
      fontSize: 11,
      fontWeight: '700',
      color: PRACTICE_UI.goldBadge,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    reason: {
      fontSize: 11,
      lineHeight: 16,
      color: PRACTICE_UI.meta,
    },
  });
}
