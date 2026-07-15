import { useCallback, useMemo } from 'react';
import {
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

const CARD_WIDTH = 218;
const CARD_HEIGHT = 198;

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
      const displayTitle = item.title
        .replace(/\s*\((easy|medium|hard)\)\s*$/i, '')
        .trim();
      const questionLabel = t('practice.questionCount', { count: item.qCount });
      const durationLabel = t('practice.durationMin', { count: item.durationMin });

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
              <Text style={[styles.badgeText, { color: pill.color }]} numberOfLines={1}>
                {pill.label.replace('● ', '')}
              </Text>
            </View>
          </View>

          <View style={styles.mid}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {displayTitle}
            </Text>
            <View style={styles.metaRow}>
              <Clock size={12} color={HOME_UI.muted} strokeWidth={1.8} />
              <Text style={styles.meta} numberOfLines={1}>
                {`${questionLabel} · ${durationLabel}`}
              </Text>
            </View>
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
      marginHorizontal: -HOME_UI.horizontalPad,
    },
    listContent: {
      gap: 12,
      paddingHorizontal: HOME_UI.horizontalPad,
    },
    cardWrap: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 22,
    },
    cardBody: {
      flex: 1,
      padding: 14,
      justifyContent: 'flex-start',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    mid: {
      flex: 1,
      marginTop: 10,
      gap: 6,
    },
    title: {
      minHeight: 38,
      fontSize: 14,
      fontWeight: '700',
      color: HOME_UI.ink,
      lineHeight: 19,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    meta: {
      flex: 1,
      fontSize: 12,
      color: HOME_UI.muted,
      fontWeight: '600',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: HOME_UI.goldBorder,
      backgroundColor: HOME_UI.goldSoft,
    },
    badgeDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });
}
