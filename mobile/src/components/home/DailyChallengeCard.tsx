import { Pressable, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { PremiumHeroCard } from '../PremiumHeroCard';
import type { HomeFeed } from '../../types/home';

type DailyChallengeCardProps = {
  challenge: HomeFeed['dailyChallenge'];
  onPress?: (deeplink: string) => void;
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 22,
  },
  pressed: {
    opacity: 0.96,
  },
});

export function DailyChallengeCard({ challenge, onPress }: DailyChallengeCardProps) {
  const { t } = useTranslation(['app', 'practice']);

  if (!challenge) {
    return null;
  }

  const done = challenge.status === 'done';
  const deeplink = `/stack/Quiz/${challenge.id}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(deeplink)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <PremiumHeroCard
        icon={<Star size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={t('home.dailyChallenge')}
        title={challenge.title || t('home.questionsToday', { count: challenge.qCount })}
        stats={[{ label: t('practice.questions'), value: String(challenge.qCount) }]}
        hint={t('home.challengeEarn', { coins: challenge.rewardCoins })}
      >
        <Button
          label={done ? t('home.challengeDoneMark') : t('home.challengeStart')}
          variant="gold"
          size="sm"
          fullWidth
          disabled={done}
          onPress={() => onPress?.(deeplink)}
        />
      </PremiumHeroCard>
    </Pressable>
  );
}
