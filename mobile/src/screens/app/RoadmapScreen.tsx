import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Compass } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FeatureScreenLayout,
  MilestoneNode,
  PremiumFeatureCard,
  PremiumHeroCard,
  PremiumScreen,
  RankRing,
  SectionTitle,
} from '../../components';
import { useGoalRoadmap, useProfile } from '../../hooks';
import { useTheme } from '../../theme';

export function RoadmapScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const goalQuery = useGoalRoadmap(Boolean(profileQuery.data?.profile.goal?.examTrack));
  const roadmap = goalQuery.data?.roadmap;

  if (goalQuery.isLoading) {
    return (
      <PremiumScreen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </PremiumScreen>
    );
  }

  if (!roadmap) {
    return (
      <FeatureScreenLayout title={t('roadmap.title')}>
        <Text style={styles.empty}>{t('roadmap.setGoalEmpty')}</Text>
      </FeatureScreenLayout>
    );
  }

  return (
    <FeatureScreenLayout
      title={t('roadmap.title')}
      subtitle={t('roadmap.subtitle', {
        exam: roadmap.examName,
        year: roadmap.targetYear,
      })}
    >
      <PremiumHeroCard
        icon={<Compass size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={t('roadmap.currentStage')}
        title={roadmap.currentStage ?? t('roadmap.inProgress')}
        stats={[
          {
            label: t('roadmap.overallProgress'),
            value: `${roadmap.overallProgress ?? 0}%`,
          },
        ]}
      >
        <View style={styles.heroRingWrap}>
          <RankRing
            value={roadmap.overallProgress ?? 0}
            max={100}
            label={t('roadmap.progress')}
            size={100}
            variant="teal"
            trackColor="rgba(255,255,255,0.15)"
            accentColor="#F4D58D"
            labelColor="rgba(255,255,255,0.6)"
          />
        </View>
      </PremiumHeroCard>

      <SectionTitle title={t('roadmap.milestoneJourney')} />
      <PremiumFeatureCard style={styles.journey}>
        {roadmap.stages.map((stage, index) => (
          <MilestoneNode
            key={stage.order}
            title={stage.name}
            subtitle={stage.tips[0]}
            status={stage.status}
            isLast={index === roadmap.stages.length - 1}
          />
        ))}
      </PremiumFeatureCard>

      {(roadmap.upcomingDates ?? []).length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title={t('roadmap.upcomingDates')} />
          <PremiumFeatureCard style={styles.dates}>
            {roadmap.upcomingDates!.map((item) => (
              <View key={`${item.label}-${item.date}`} style={styles.dateRow}>
                <Text style={styles.dateLabel}>{item.label}</Text>
                <Text style={styles.dateValue}>
                  {new Date(item.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </PremiumFeatureCard>
        </View>
      ) : null}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    centered: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary, textAlign: 'center' },
    heroRingWrap: { alignItems: 'center', zIndex: 1 },
    journey: { gap: theme.spacing.sm },
    section: { gap: theme.spacing.md },
    dates: { gap: theme.spacing.md },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateLabel: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    dateValue: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
  });
}
