import { useNavigation } from '@react-navigation/native';
import { Target } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  ProgressBar,
  RankRing,
  Screen,
  SectionTitle,
  ShareMilestoneButton,
} from '../../components';
import { useAuth } from '../../auth';
import { useProfile, useReadiness } from '../../hooks';
import { useTheme } from '../../theme';

export function ReadinessScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileQuery = useProfile();
  const hasGoal = Boolean(profileQuery.data?.profile.goal?.examTrack);
  const readinessQuery = useReadiness(hasGoal);
  const data = readinessQuery.data;

  if (profileQuery.isLoading || readinessQuery.isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  if (!hasGoal || !data) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.empty}>Set your exam goal to see readiness score.</Text>
        <Button label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const cutoff = data.cutoffGap;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Readiness score"
        subtitle={`${data.examTrack}${data.targetYear ? ` · ${data.targetYear}` : ''}`}
      />

      <Card style={styles.hero}>
        <RankRing value={data.score} max={100} label="Goal ready" size={128} variant="gold" />
        <Text style={styles.assessed}>
          Updated {new Date(data.assessedAt).toLocaleDateString('en-IN')}
        </Text>
      </Card>

      <ShareMilestoneButton
        fullWidth
        variant="gold"
        data={{
          kind: 'readiness',
          userName: user?.name ?? 'Sopaan student',
          headline: `${data.score}%`,
          subtitle: `${data.examTrack}${data.targetYear ? ` · ${data.targetYear}` : ''}`,
          metrics: data.byArea.slice(0, 3).map((area) => ({
            label: area.name,
            value: `${area.pct}%`,
          })),
          footerNote: 'Tracking my exam readiness on Sopaan',
        }}
      />

      <SectionTitle title="Area breakdown" />
      <Card style={styles.areas}>
        {data.byArea.map((area) => (
          <ProgressBar
            key={area.name}
            label={area.name}
            value={area.pct}
            max={100}
            showValue
            variant={area.pct >= 70 ? 'teal' : area.pct >= 50 ? 'gold' : 'primary'}
          />
        ))}
      </Card>

      {cutoff ? (
        <View style={styles.section}>
          <SectionTitle title="Cutoff gap" />
          <Card style={styles.cutoffCard}>
            {cutoff.note ? (
              <Text style={styles.cutoffNote}>{cutoff.note}</Text>
            ) : (
              <>
                <View style={styles.cutoffRow}>
                  <View style={styles.cutoffStat}>
                    <Text style={styles.cutoffValue}>{cutoff.current}</Text>
                    <Text style={styles.cutoffLabel}>Your proxy</Text>
                  </View>
                  <Target size={20} color={theme.colors.text.tertiary} />
                  <View style={styles.cutoffStat}>
                    <Text style={styles.cutoffValue}>{cutoff.target ?? '—'}</Text>
                    <Text style={styles.cutoffLabel}>
                      Target {cutoff.category ?? ''} {cutoff.year ?? ''}
                    </Text>
                  </View>
                </View>
                {cutoff.gap != null && cutoff.gap > 0 ? (
                  <Text style={styles.gapText}>
                    You need ~{cutoff.gap} more marks to reach the cutoff benchmark.
                  </Text>
                ) : (
                  <Text style={styles.gapGood}>You are at or above the cutoff benchmark.</Text>
                )}
              </>
            )}
          </Card>
        </View>
      ) : null}

      {(data.focusNext ?? []).length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Focus next" />
          <Card style={styles.focusCard}>
            {data.focusNext!.map((item) => (
              <Text key={item} style={styles.focusItem}>• {item}</Text>
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
    centered: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary, textAlign: 'center' },
    hero: { alignItems: 'center', paddingVertical: theme.spacing.xl, gap: theme.spacing.sm },
    assessed: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    areas: { gap: theme.spacing.md },
    section: { gap: theme.spacing.md },
    cutoffCard: { gap: theme.spacing.md },
    cutoffNote: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    cutoffRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cutoffStat: { alignItems: 'center', gap: theme.spacing.xs },
    cutoffValue: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
    cutoffLabel: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    gapText: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.semantic.warning,
    },
    gapGood: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.semantic.success,
    },
    focusCard: { gap: theme.spacing.sm },
    focusItem: { ...theme.typography.presets.body, color: theme.colors.text.primary },
  });
}
