import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomePremiumButton } from './HomePremiumButton';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AINudge } from '../../types/home';
import { displayExamName } from '../../utils/examTarget';
import { AINudgeCard } from './AINudgeCard';
import { denseTextProps } from '../../a11y/textProps';
import { HOME_AI_ACTION_TILES } from '../../content/homeContent';
import { nudgePremiumTone, resolveHomeIcon } from './homeIcons';
import { HOME_UI, homePressFeedback } from './homeTheme';

type HomeAIHubProps = {
  nudges: AINudge[];
  examName?: string | null;
  daysLeft?: number | null;
  onNudgePress: (deeplink: string) => void;
  onAskAiPress: (initialPrompt?: string) => void;
  onExamPlanPress?: () => void;
  onGenerateTestPress?: () => void;
  onGamesPress?: () => void;
};

export function HomeAIHub({
  nudges,
  examName,
  daysLeft,
  onNudgePress,
  onAskAiPress,
  onExamPlanPress,
  onGenerateTestPress,
  onGamesPress,
}: HomeAIHubProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const featured = nudges[0];
  const rest = nudges.slice(1);
  const resolvedExam = displayExamName(examName);
  const hasSuggestion = Boolean(featured?.title?.trim());

  const coachTitle = hasSuggestion
    ? featured!.title
    : resolvedExam
      ? t('home.aiHubExamCoach', { exam: resolvedExam })
      : t('home.aiCoachFallbackTitle');

  const coachHint = hasSuggestion
    ? featured!.body
    : resolvedExam && daysLeft != null
      ? t('home.aiHubContextHint', { days: daysLeft, exam: resolvedExam })
      : t('home.aiCoachFallbackHint');

  const FeaturedIcon = resolveHomeIcon(hasSuggestion ? featured!.icon : 'sparkles');
  const featuredTone = nudgePremiumTone(hasSuggestion ? featured!.tone : 'info');

  const quickActions = useMemo(() => {
    const handlers = {
      generate: onGenerateTestPress,
      games: onGamesPress,
      ask: () => onAskAiPress(),
      plan: onExamPlanPress,
    } as const;

    return HOME_AI_ACTION_TILES.map((tile) => ({
      key: tile.key,
      label: t(`home.${tile.labelKey}`),
      Icon: tile.Icon,
      testID: tile.testID,
      onPress: handlers[tile.key],
    })).filter((tile) => Boolean(tile.onPress));
  }, [onAskAiPress, onExamPlanPress, onGamesPress, onGenerateTestPress, t]);

  return (
    <View style={styles.wrap} testID="home-ai-hub">
      <LinearGradient
        colors={HOME_UI.heroGradient}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.hero}
        testID="home-ai-coach-card"
      >
        <View style={styles.meshGlow} pointerEvents="none" />

        <View style={styles.heroTop}>
          <HomeSlotIcon slot="featured" Icon={FeaturedIcon} tone={featuredTone} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{t('home.aiFeaturedEyebrow')}</Text>
            <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
              {coachTitle}
            </Text>
          </View>
        </View>

        <Text style={styles.heroHint} numberOfLines={2} ellipsizeMode="tail">
          {coachHint}
        </Text>

        <HomePremiumButton
          label={t('home.aiCoachCta')}
          variant="gold"
          size="md"
          fullWidth
          trailingIcon={ArrowRight}
          onPress={() => onAskAiPress()}
          testID="home-ask-ai-cta"
        />
      </LinearGradient>

      {quickActions.length > 0 ? (
        <>
          <View style={styles.promptHeader}>
            <Sparkles size={13} color={HOME_UI.goldDeep} strokeWidth={2} />
            <Text style={styles.promptHeaderText}>{t('home.aiHubQuickActions')}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            testID="home-ai-coach-prompts"
          >
            {quickActions.map((action) => {
              const Icon = action.Icon;
              return (
                <Pressable
                  key={action.key}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={action.onPress}
                  style={({ pressed }) => [styles.chip, pressed && homePressFeedback]}
                  testID={action.testID}
                >
                  <View style={styles.chipIcon}>
                    <Icon size={15} color={HOME_UI.goldDeep} strokeWidth={2.2} />
                  </View>
                  <Text
                    {...denseTextProps}
                    style={styles.chipLabel}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

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
    hero: {
      borderRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
      gap: 10,
      overflow: 'hidden',
    },
    meshGlow: {
      position: 'absolute',
      top: -70,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(201,162,75,0.25)',
      opacity: 0.55,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroCopy: {
      flex: 1,
      gap: 4,
      paddingTop: 2,
      minWidth: 0,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      color: HOME_UI.goldLt,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 19,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.2,
      lineHeight: 25,
    },
    heroHint: {
      fontSize: 13.5,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.72)',
      lineHeight: 21,
    },
    promptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 4,
      marginTop: 6,
    },
    promptHeaderText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: HOME_UI.muted,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    chipRow: {
      gap: 8,
      paddingVertical: 2,
      paddingRight: 4,
      alignItems: 'center',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 99,
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: '#EDE7D6',
    },
    chipIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      flexShrink: 0,
    },
    chipLabel: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.ink,
    },
    moreStack: {
      gap: 8,
      marginTop: 2,
    },
  });
}
