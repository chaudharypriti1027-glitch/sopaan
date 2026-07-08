import { Pressable, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomePremiumButton } from './HomePremiumButton';
import { PremiumHeroCard } from '../PremiumHeroCard';
import type { HomeFeed } from '../../types/home';
import { HOME_UI, homePressFeedback } from './homeTheme';

type DailyChallengeCardProps = {
  challenge: HomeFeed['dailyChallenge'];
  onPress?: (deeplink: string) => void;
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: HOME_UI.cardRadiusLg,
  },
  pressed: homePressFeedback,
});

export function DailyChallengeCard({ challenge, onPress }: DailyChallengeCardProps) {
  const { t } = useTranslation(['app', 'practice']);

  if (!challenge) {
    return null;
  }

  const done = challenge.status === 'done';
  const deeplink = `/stack/Quiz/${challenge.testId}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(deeplink)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <PremiumHeroCard
        icon={<HomeSlotIcon slot="featured" Icon={Star} tone="gold" />}
        eyebrow={t('home.dailyChallenge')}
        title={challenge.title || t('home.questionsToday', { count: challenge.qCount })}
        stats={[{ label: t('practice.questions'), value: String(challenge.qCount) }]}
        hint={t('home.challengeEarn', { coins: challenge.rewardCoins })}
      >
        <HomePremiumButton
          label={done ? t('home.challengeDoneMark') : t('home.challengeStart')}
          variant={done ? 'ghost' : 'gold'}
          size="md"
          fullWidth
          disabled={done}
          onPress={() => onPress?.(deeplink)}
        />
      </PremiumHeroCard>
    </Pressable>
  );
}
