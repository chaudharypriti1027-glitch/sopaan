import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import {
  Card,
  MilestoneNode,
  ProgressBar,
  RankRing,
  Screen,
  SectionTitle,
} from '../../components';
import { useGoalRoadmap, useProfile } from '../../hooks';
import { useTheme } from '../../theme';

export function RoadmapScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const goalQuery = useGoalRoadmap(Boolean(profileQuery.data?.profile.goal?.examTrack));
  const roadmap = goalQuery.data?.roadmap;

  if (goalQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  if (!roadmap) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.empty}>Set your exam goal to see your roadmap.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Goal roadmap"
        subtitle={`${roadmap.examName} · Target ${roadmap.targetYear}`}
      />

      <Card style={styles.hero}>
        <RankRing
          value={roadmap.overallProgress ?? 0}
          max={100}
          label="Progress"
          size={110}
          variant="teal"
        />
        <View style={styles.heroText}>
          <Text style={styles.currentLabel}>Current stage</Text>
          <Text style={styles.currentStage}>{roadmap.currentStage}</Text>
          <ProgressBar value={roadmap.overallProgress ?? 0} variant="primary" showValue />
        </View>
      </Card>

      <SectionTitle title="Milestone journey" />
      <Card style={styles.journey}>
        {roadmap.stages.map((stage, index) => (
          <MilestoneNode
            key={stage.order}
            title={stage.name}
            subtitle={stage.tips[0]}
            status={stage.status}
            isLast={index === roadmap.stages.length - 1}
          />
        ))}
      </Card>

      {(roadmap.upcomingDates ?? []).length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Upcoming dates" />
          <Card style={styles.dates}>
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
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary, textAlign: 'center' },
    hero: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
    heroText: { flex: 1, gap: theme.spacing.sm },
    currentLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.text.tertiary,
      textTransform: 'uppercase',
    },
    currentStage: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
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
