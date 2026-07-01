import { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type ListRenderItem,
} from 'react-native';
import { ArrowRight, Clock } from 'lucide-react-native';
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
      return { color: HOME_UI.sageDeep, bg: HOME_UI.sageSoft, label: t('home.difficultyEasyLabel') };
    case 'hard':
      return { color: HOME_UI.accent, bg: HOME_UI.accentSoft, label: t('home.difficultyHardLabel') };
    default:
      return { color: HOME_UI.goldDeep, bg: HOME_UI.goldSoft, label: t('home.difficultyMediumLabel') };
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
            <View style={styles.topRow}>
              <View style={styles.testIcon}>
                <RNText style={styles.emoji}>{emoji}</RNText>
              </View>
              <View style={[styles.badge, { backgroundColor: pill.bg }]}>
                <Text style={[styles.badgeText, { color: pill.color }]}>{pill.label}</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.sub}>
              {subject} · {difficultyLabel}
            </Text>
            <View style={styles.metaRow}>
              <Clock size={11} color={HOME_UI.muted} strokeWidth={2.2} />
              <Text style={styles.meta}>
                {t('practice.questionCount', { count: item.qCount })} ·{' '}
                {t('practice.durationMin', { count: item.durationMin })}
              </Text>
            </View>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>{t('home.startTest')}</Text>
              <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.4} />
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
      borderRadius: 26,
      paddingVertical: 16,
      paddingHorizontal: 15,
      borderWidth: 1.5,
      borderColor: HOME_UI.border,
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
      minHeight: 206,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 11,
    },
    testIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: HOME_UI.accentSoft,
      borderWidth: 1.5,
      borderColor: HOME_UI.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
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
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    cta: {
      marginTop: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: HOME_UI.accent,
      borderRadius: 12,
      paddingVertical: 10,
      shadowColor: HOME_UI.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 2,
    },
    ctaText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}
