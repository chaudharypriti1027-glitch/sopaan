import { useCallback, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { ArrowRight, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomeFeedCard } from './HomeFeedCard';
import { HomePremiumButton } from './HomePremiumButton';
import { Text } from '../Text';
import type { TestCard } from '../../types/home';
import { resolveTestSubjectIcon, testDifficultyIconTone } from './homeIcons';
import { HOME_UI } from './homeTheme';

const CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.72);

type RecommendedRowProps = {
  tests: TestCard[];
  onTestPress?: (testId: string) => void;
};

function difficultyTone(difficulty: TestCard['difficulty']) {
  return testDifficultyIconTone(difficulty);
}

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
      const iconTone = difficultyTone(item.difficulty);
      const subject = item.tag ?? t('home.general');
      const difficultyLabel = t(`practice.difficulty${item.difficulty.charAt(0).toUpperCase()}${item.difficulty.slice(1)}` as 'practice.difficultyEasy');

      return (
        <HomeFeedCard
          onPress={() => onTestPress?.(item.id)}
          accentTop
          style={styles.cardWrap}
          contentStyle={styles.cardBody}
        >
          <View style={styles.topRow}>
            <HomeSlotIcon slot="shortcut" Icon={SubjectIcon} tone={iconTone} />
            <View style={[styles.badge, { backgroundColor: pill.bg }]}>
              <View style={[styles.badgeDot, { backgroundColor: pill.color }]} />
              <Text style={[styles.badgeText, { color: pill.color }]}>
                {pill.label.replace('● ', '')}
              </Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.sub}>
            {subject} · {difficultyLabel}
          </Text>
          <View style={styles.metaRow}>
            <HomeSlotIcon slot="inline" Icon={Clock} tone="slate" />
            <Text style={styles.meta}>
              {t('practice.questionCount', { count: item.qCount })} ·{' '}
              {t('practice.durationMin', { count: item.durationMin })}
            </Text>
          </View>
          <HomePremiumButton
            label={t('home.startTest')}
            variant="navy"
            size="sm"
            fullWidth
            trailingIcon={ArrowRight}
            onPress={() => onTestPress?.(item.id)}
          />
        </HomeFeedCard>
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
      marginHorizontal: -HOME_UI.sectionPanelPad,
    },
    listContent: {
      gap: 12,
      paddingHorizontal: HOME_UI.sectionPanelPad,
    },
    cardWrap: {
      width: CARD_WIDTH,
    },
    cardBody: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      minHeight: 200,
      gap: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
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
      marginBottom: 10,
      letterSpacing: 0.2,
      textTransform: 'capitalize',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 14,
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
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
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
  });
}
