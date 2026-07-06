import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomeFeedCard } from './HomeFeedCard';
import { HomePremiumButton } from './HomePremiumButton';
import { PremiumHeroCard } from '../PremiumHeroCard';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AINudge } from '../../types/home';
import { AINudgeCard } from './AINudgeCard';
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
          trailing={<HomeSlotIcon slot="micro" Icon={Sparkles} tone="gold" />}
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
        {prompts.map((prompt) => (
          <HomeFeedCard
            key={prompt.key}
            onPress={() => onAskAiPress(prompt.label)}
            contentStyle={styles.promptBody}
            testID={`home-ai-prompt-${prompt.key}`}
          >
            <HomeSlotIcon slot="micro" Icon={prompt.Icon} tone="lavender" />
            <Text style={styles.promptLabel} numberOfLines={2}>
              {prompt.label}
            </Text>
          </HomeFeedCard>
        ))}
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

      <HomeFeedCard onPress={() => onAskAiPress()} contentStyle={styles.askBody} testID="home-ask-ai-row">
        <HomeSlotIcon slot="shortcut" Icon={Sparkles} tone="gold" />
        <View style={styles.askCopy}>
          <Text style={styles.askTitle}>{t('home.askAi')}</Text>
          <Text style={styles.askSubtitle} numberOfLines={1}>
            {t('home.aiHubAskSubtitle')}
          </Text>
        </View>
        <HomeSlotIcon slot="button" Icon={ArrowRight} tone="lavender" />
      </HomeFeedCard>
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
    promptRow: { gap: 8, paddingVertical: 2 },
    promptBody: {
      width: 120,
      minHeight: 92,
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 8,
    },
    promptLabel: {
      fontSize: 10.5,
      lineHeight: 13,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '700',
      color: HOME_UI.ink,
    },
    moreStack: { gap: 10 },
    askBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    askCopy: { flex: 1, gap: 1, minWidth: 0 },
    askTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: HOME_UI.ink,
    },
    askSubtitle: {
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
  });
}
