import { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type ListRenderItem,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { TestCard } from '../../types/home';
import { CONTINUE_CARD_WIDTH } from './homeUtils';
import { HOME_UI } from './homeTheme';

type RecommendedRowProps = {
  tests: TestCard[];
  onTestPress?: (testId: string) => void;
};

const TEST_EMOJI = ['🐍', '🌐', '⚡', '📚', '🎯'];

function difficultyStyle(
  difficulty: TestCard['difficulty'],
  t: (key: string) => string,
) {
  switch (difficulty) {
    case 'easy':
      return { color: '#059669', bg: '#DCFCE7', label: t('home.difficultyEasyLabel') };
    case 'hard':
      return { color: '#DC2626', bg: '#FEE2E2', label: t('home.difficultyHardLabel') };
    default:
      return { color: '#D97706', bg: '#FEF9C3', label: t('home.difficultyMediumLabel') };
  }
}

export function RecommendedRow({ tests, onTestPress }: RecommendedRowProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderItem = useCallback<ListRenderItem<TestCard>>(
    ({ item, index }) => {
      const pill = difficultyStyle(item.difficulty, t);
      const emoji = TEST_EMOJI[index % TEST_EMOJI.length];
      const subject = item.tag ?? t('home.general');
      const difficultyLabel = t(`practice.difficulty${item.difficulty.charAt(0).toUpperCase()}${item.difficulty.slice(1)}` as 'practice.difficultyEasy');

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => onTestPress?.(item.id)}
          style={styles.cardWrap}
        >
          <View style={styles.card}>
            <View style={styles.testIcon}>
              <RNText style={styles.emoji}>{emoji}</RNText>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.sub}>
              {subject} · {difficultyLabel}
            </Text>
            <View style={styles.metaRow}>
              <Clock size={11} color="#C4CBD8" strokeWidth={2.2} />
              <Text style={styles.meta}>
                {t('practice.questionCount', { count: item.qCount })} ·{' '}
                {t('practice.durationMin', { count: item.durationMin })}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: pill.bg }]}>
              <Text style={[styles.badgeText, { color: pill.color }]}>{pill.label}</Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [onTestPress, styles, t],
  );

  if (!tests.length) {
    return null;
  }

  return (
    <FlatList
      horizontal
      data={tests}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      nestedScrollEnabled
    />
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    list: {
      marginHorizontal: -16,
    },
    listContent: {
      gap: 13,
      paddingHorizontal: 16,
    },
    cardWrap: {
      width: CONTINUE_CARD_WIDTH,
    },
    card: {
      backgroundColor: HOME_UI.surface,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 15,
      borderWidth: 1.5,
      borderColor: HOME_UI.border,
      shadowColor: '#0F143C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
      minHeight: 168,
    },
    testIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: HOME_UI.accentSoft,
      borderWidth: 1.5,
      borderColor: '#C7D2FE',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emoji: { fontSize: 22 },
    title: {
      fontSize: 14,
      fontWeight: '800',
      color: HOME_UI.ink,
      lineHeight: 18,
      marginBottom: 3,
    },
    sub: {
      fontSize: 11,
      color: HOME_UI.muted,
      fontWeight: '500',
      marginBottom: 11,
      letterSpacing: 0.2,
      textTransform: 'capitalize',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 12,
    },
    meta: {
      fontSize: 11,
      color: HOME_UI.muted,
      fontWeight: '500',
    },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
  });
}
