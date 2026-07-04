import { useCallback, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { ArrowRight, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { toneColors, toneForText } from '../../utils/iconTone';
import type { TestCard } from '../../types/home';
import { resolveTestSubjectIcon } from './homeUtils';
import { HOME_UI } from './homeTheme';

const CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.74);

type RecommendedRowProps = {
  tests: TestCard[];
  onTestPress?: (testId: string) => void;
};

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
  const styles = useMemo(() => createStyles(), []);

  const renderItem = useCallback<ListRenderItem<TestCard>>(
    ({ item }) => {
      const pill = difficultyStyle(item.difficulty, t);
      const SubjectIcon = resolveTestSubjectIcon(item.tag, item.title);
      const iconTone = toneColors(toneForText(item.tag ?? item.title));
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
              <View style={[styles.testIcon, { backgroundColor: iconTone.bg }]}>
                <SubjectIcon size={20} color={iconTone.fg} strokeWidth={2} />
              </View>
              <View style={[styles.badge, { backgroundColor: pill.bg }]}>
                <View style={[styles.badgeDot, { backgroundColor: pill.color }]} />
                <Text style={[styles.badgeText, { color: pill.color }]}>{pill.label.replace('● ', '')}</Text>
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

function createStyles() {
  return StyleSheet.create({
    list: {
      marginHorizontal: -16,
    },
    listContent: {
      gap: 12,
      paddingHorizontal: 16,
    },
    cardWrap: {
      width: CARD_WIDTH,
    },
    card: {
      backgroundColor: HOME_UI.surface,
      borderRadius: 22,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      shadowColor: HOME_UI.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
      minHeight: 200,
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: HOME_UI.ink,
      lineHeight: 19,
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    sub: {
      fontSize: 11.5,
      color: HOME_UI.muted,
      fontWeight: '600',
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    badgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    cta: {
      marginTop: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: HOME_UI.accent,
      borderRadius: 12,
      paddingVertical: 11,
      shadowColor: HOME_UI.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 3,
    },
    ctaText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}
