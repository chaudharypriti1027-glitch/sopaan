import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomeFeedCard } from './HomeFeedCard';
import { HomePremiumButton } from './HomePremiumButton';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AINudge } from '../../types/home';
import { displayExamName } from '../../utils/examTarget';
import { AINudgeCard } from './AINudgeCard';
import { PREMIUM_ICON_TONES } from '../premium/premiumIconTokens';
import { HOME_COACH_PROMPTS } from '../../content/homeContent';
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

type CoachPrompt = {
  key: string;
  label: string;
  subtitle: string;
  Icon: ReturnType<typeof resolveHomeIcon>;
  tone: (typeof HOME_COACH_PROMPTS)[number]['tone'];
  action: 'ask' | 'examPlan' | 'practice' | 'games';
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

  const prompts = useMemo<CoachPrompt[]>(
    () =>
      HOME_COACH_PROMPTS.map((entry) => ({
        ...entry,
        label: t(`home.${entry.key}`),
        subtitle: t(`home.${entry.key}Sub`),
        Icon: resolveHomeIcon(entry.icon),
        action: entry.action,
      })),
    [t],
  );

  const handlePromptPress = (prompt: CoachPrompt) => {
    if (prompt.action === 'examPlan') {
      onExamPlanPress?.();
      return;
    }
    if (prompt.action === 'practice') {
      onGenerateTestPress?.();
      return;
    }
    if (prompt.action === 'games') {
      onGamesPress?.();
      return;
    }
    onAskAiPress(prompt.label);
  };

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
        <View style={styles.meshRing} pointerEvents="none" />

        {resolvedExam ? (
          <View style={styles.examRow}>
            <View style={styles.examPill}>
              <BookOpen size={12} color={HOME_UI.goldLt} strokeWidth={2.2} />
              <Text style={styles.examPillText} numberOfLines={1}>
                {resolvedExam}
              </Text>
            </View>
            {daysLeft != null ? (
              <View style={styles.daysPill}>
                <NumText style={styles.daysPillNum}>{daysLeft}</NumText>
                <Text style={styles.daysPillLabel}>{t('home.daysUnit')}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.heroTop}>
          <HomeSlotIcon slot="featured" Icon={FeaturedIcon} tone={featuredTone} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{t('home.aiFeaturedEyebrow')}</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {coachTitle}
            </Text>
          </View>
        </View>

        <Text style={styles.heroHint} numberOfLines={3}>
          {coachHint}
        </Text>

        <View style={styles.heroActions}>
          <HomePremiumButton
            label={t('home.aiCoachCta')}
            variant="gold"
            size="md"
            fullWidth
            trailingIcon={ArrowRight}
            onPress={() => onAskAiPress()}
            testID="home-ask-ai-cta"
          />
          <View style={styles.secondaryRow}>
            {onGenerateTestPress ? (
              <HomePremiumButton
                label={t('home.aiActionGenerate')}
                variant="ghost"
                size="sm"
                onPress={onGenerateTestPress}
                testID="home-ai-generate-test-cta"
                style={styles.secondaryBtn}
              />
            ) : null}
            {onGamesPress ? (
              <HomePremiumButton
                label={t('home.aiActionGames')}
                variant="ghost"
                size="sm"
                onPress={onGamesPress}
                testID="home-ai-games-cta"
                style={styles.secondaryBtn}
              />
            ) : null}
            {onExamPlanPress ? (
              <HomePremiumButton
                label={t('home.openExamPlanCta')}
                variant="ghost"
                size="sm"
                onPress={onExamPlanPress}
                testID="home-ai-exam-plan-cta"
                style={styles.secondaryBtn}
              />
            ) : null}
            {hasSuggestion && featured ? (
              <HomePremiumButton
                label={t('home.aiFeaturedCta')}
                variant="ghost"
                size="sm"
                onPress={() => onNudgePress(featured.deeplink)}
                testID={`home-ai-featured-${featured.id}`}
                style={styles.secondaryBtn}
              />
            ) : null}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.promptHeader}>
        <Sparkles size={14} color={HOME_UI.goldDeep} strokeWidth={2} />
        <Text style={styles.promptHeaderText}>{t('home.aiHubQuickActions')}</Text>
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
              onPress={() => handlePromptPress(prompt)}
              tint={palette.bg}
              accentLeft={palette.fg}
              accentTop={prompt.action === 'examPlan'}
              contentStyle={styles.promptBody}
              testID={`home-ai-prompt-${prompt.key}`}
            >
              <HomeSlotIcon slot="shortcut" Icon={prompt.Icon} tone={prompt.tone} />
              <Text style={styles.promptLabel} numberOfLines={2}>
                {prompt.label}
              </Text>
              <Text style={styles.promptSub} numberOfLines={2}>
                {prompt.subtitle}
              </Text>
            </HomeFeedCard>
          );
        })}
      </ScrollView>

      {rest.length > 0 ? (
        <View style={styles.moreStack}>
          <Text style={styles.moreLabel}>{t('home.aiHubSuggestions')}</Text>
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
    wrap: { gap: 14 },
    hero: {
      borderRadius: HOME_UI.cardRadiusLg,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      gap: 12,
      overflow: 'hidden',
    },
    meshGlow: {
      position: 'absolute',
      top: -30,
      right: -20,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(227,201,127,0.14)',
    },
    meshRing: {
      position: 'absolute',
      top: 10,
      right: 24,
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    examRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    examPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '72%',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    examPillText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    daysPill: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 3,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: 'rgba(227,201,127,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(227,201,127,0.35)',
    },
    daysPillNum: {
      fontSize: 13,
      fontWeight: '800',
      color: HOME_UI.goldLt,
    },
    daysPillLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.72)',
      textTransform: 'uppercase',
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
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.62)',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.3,
      lineHeight: 23,
    },
    heroHint: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.68)',
      lineHeight: 17,
    },
    heroActions: {
      gap: 8,
      marginTop: 2,
    },
    secondaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    secondaryBtn: {
      flex: 1,
    },
    promptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 2,
    },
    promptHeaderText: {
      fontSize: 12,
      fontWeight: '700',
      color: HOME_UI.muted,
      letterSpacing: 0.2,
    },
    promptRow: {
      gap: 10,
      paddingVertical: 2,
      paddingRight: 4,
    },
    promptBody: {
      width: 148,
      minHeight: 118,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
      justifyContent: 'flex-start',
    },
    promptLabel: {
      fontSize: 12,
      lineHeight: 15,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: HOME_UI.ink,
    },
    promptSub: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
    moreStack: {
      gap: 8,
    },
    moreLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: HOME_UI.muted,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      paddingHorizontal: 2,
      marginBottom: 2,
    },
    pressed: homePressFeedback,
  });
}
