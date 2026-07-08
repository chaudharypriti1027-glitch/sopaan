import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomeFeedCard } from './HomeFeedCard';
import { HomePremiumButton } from './HomePremiumButton';
import { PremiumHeroCard } from '../PremiumHeroCard';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AINudge } from '../../types/home';
import { AINudgeCard } from './AINudgeCard';
import { PREMIUM_ICON_TONES } from '../premium/premiumIconTokens';
import { HOME_COACH_PROMPTS, nudgePremiumTone, resolveHomeIcon } from './homeIcons';
import { HOME_UI } from './homeTheme';

type HomeAIHubProps = {
  nudges: AINudge[];
  onNudgePress: (deeplink: string) => void;
  onAskAiPress: (initialPrompt?: string) => void;
};

export function HomeAIHub({
  nudges,
  onNudgePress,
  onAskAiPress,
}: HomeAIHubProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const featured = nudges[0];
  const rest = nudges.slice(1);
  const hasSuggestion = Boolean(featured?.title?.trim());
  const coachTitle = hasSuggestion ? featured!.title : t('home.aiCoachFallbackTitle');
  const coachHint = hasSuggestion ? featured!.body : t('home.aiCoachFallbackHint');
  const FeaturedIcon = resolveHomeIcon(hasSuggestion ? featured!.icon : 'sparkles');
  const featuredTone = nudgePremiumTone(hasSuggestion ? featured!.tone : 'info');

  const prompts = useMemo(
    () =>
      HOME_COACH_PROMPTS.map((entry) => ({
        ...entry,
        label: t(`home.${entry.key}`),
        Icon: resolveHomeIcon(entry.icon),
      })),
    [t],
  );

  return (
    <View style={styles.wrap} testID="home-ai-hub">
      <View style={styles.coachCard} testID="home-ai-coach-card">
        <PremiumHeroCard
          icon={<HomeSlotIcon slot="featured" Icon={FeaturedIcon} tone={featuredTone} />}
          eyebrow={t('home.aiFeaturedEyebrow')}
          title={coachTitle}
          hint={coachHint}
        >
          <View style={styles.coachActions}>
            <HomePremiumButton
              label={t('home.aiCoachCta')}
              variant="gold"
              size="md"
              fullWidth
              trailingIcon={ArrowRight}
              onPress={() => onAskAiPress()}
              testID="home-ask-ai-cta"
            />
            {hasSuggestion && featured ? (
              <HomePremiumButton
                label={t('home.aiFeaturedCta')}
                variant="ghost"
                size="sm"
                fullWidth
                onPress={() => onNudgePress(featured.deeplink)}
                testID={`home-ai-featured-${featured.id}`}
              />
            ) : null}
          </View>
        </PremiumHeroCard>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.promptRow}
        testID="home-ai-coach-prompts"
      >
        {prompts.map((prompt) => {
          const palette = PREMIUM_ICON_TONES[prompt.tone];

          return (
            <HomeFeedCard
              key={prompt.key}
              onPress={() => onAskAiPress(prompt.label)}
              tint={palette.bg}
              accentLeft={palette.fg}
              contentStyle={styles.promptBody}
              testID={`home-ai-prompt-${prompt.key}`}
            >
              <HomeSlotIcon slot="shortcut" Icon={prompt.Icon} tone={prompt.tone} />
              <Text style={styles.promptLabel} numberOfLines={2}>
                {prompt.label}
              </Text>
            </HomeFeedCard>
          );
        })}
      </ScrollView>

      {rest.length > 0 ? (
        <View style={styles.moreStack}>
          {rest.map((nudge) => (
            <View key={nudge.id} testID={`home-section-nudge-${nudge.id}`}>
              <AINudgeCard nudge={nudge} onPress={onNudgePress} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: { gap: 12 },
    coachCard: {
      borderRadius: HOME_UI.cardRadiusLg,
      overflow: 'hidden',
    },
    coachActions: { gap: 8 },
    promptRow: { gap: 10, paddingVertical: 2, paddingRight: 4 },
    promptBody: {
      width: 132,
      minHeight: 100,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      justifyContent: 'flex-start',
    },
    promptLabel: {
      fontSize: 11.5,
      lineHeight: 14.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: HOME_UI.ink,
    },
    moreStack: { gap: 8 },
  });
}
