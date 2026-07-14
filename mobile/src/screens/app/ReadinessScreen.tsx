import { useNavigation } from '@react-navigation/native';
import { Target } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FeatureScreenLayout,
  PremiumFeatureCard,
  PremiumHeroCard,
  PremiumScreen,
  ProgressBar,
  RankRing,
  SectionTitle,
  ShareMilestoneButton,
} from '../../components';
import { useAuth } from '../../auth';
import { useProfile, useReadiness } from '../../hooks';
import { useTheme } from '../../theme';

export function ReadinessScreen() {
  const { t } = useTranslation('app');
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
      <PremiumScreen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </PremiumScreen>
    );
  }

  if (!hasGoal || !data) {
    return (
      <FeatureScreenLayout title={t('readiness.title')}>
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>{t('readiness.setGoalEmpty')}</Text>
          <Button label={t('readiness.goBack')} variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </FeatureScreenLayout>
    );
  }

  const cutoff = data.cutoffGap;
  const headerSubtitle = `${data.examTrack}${data.targetYear ? ` · ${data.targetYear}` : ''}`;

  return (
    <FeatureScreenLayout title={t('readiness.title')} subtitle={headerSubtitle}>
      <PremiumHeroCard
        icon={<Target size={24} color="#FFFFFF" strokeWidth={1.8} />}
        eyebrow={t('readiness.goalReady')}
        title={t('readiness.readyTitle', { score: data.score })}
      >
        <View style={styles.heroRingWrap}>
          <RankRing
            value={data.score}
            max={100}
            label={t('readiness.goalReady')}
            size={110}
            variant="gold"
            trackColor="rgba(255,255,255,0.15)"
            accentColor="#F4D58D"
            labelColor="rgba(255,255,255,0.6)"
          />
        </View>
        <Text style={styles.assessed}>
          {t('readiness.updated', {
            date: new Date(data.assessedAt).toLocaleDateString('en-IN'),
          })}
        </Text>
      </PremiumHeroCard>

      <ShareMilestoneButton
        fullWidth
        variant="gold"
        data={{
          kind: 'readiness',
          userName: user?.name ?? t('profile.sopaanStudent'),
          headline: `${data.score}%`,
          subtitle: headerSubtitle,
          metrics: data.byArea.slice(0, 3).map((area) => ({
            label: area.name,
            value: `${area.pct}%`,
          })),
          footerNote: t('readiness.footerNote'),
        }}
      />

      <SectionTitle title={t('readiness.areaBreakdown')} />
      <PremiumFeatureCard style={styles.areas}>
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
      </PremiumFeatureCard>

      {cutoff ? (
        <View style={styles.section}>
          <SectionTitle title={t('readiness.cutoffGap')} />
          <PremiumFeatureCard style={styles.cutoffCard}>
            {cutoff.note ? (
              <Text style={styles.cutoffNote}>{cutoff.note}</Text>
            ) : (
              <>
                <View style={styles.cutoffRow}>
                  <View style={styles.cutoffStat}>
                    <Text style={styles.cutoffValue}>{cutoff.current}</Text>
                    <Text style={styles.cutoffLabel}>{t('readiness.yourProxy')}</Text>
                  </View>
                  <Target size={20} color={theme.colors.text.tertiary} />
                  <View style={styles.cutoffStat}>
                    <Text style={styles.cutoffValue}>{cutoff.target ?? '—'}</Text>
                    <Text style={styles.cutoffLabel}>
                      {t('readiness.target', {
                        category: cutoff.category ?? '',
                        year: cutoff.year ?? '',
                      })}
                    </Text>
                  </View>
                </View>
                {cutoff.gap != null && cutoff.gap > 0 ? (
                  <Text style={styles.gapText}>
                    {t('readiness.gapNeeded', { gap: cutoff.gap })}
                  </Text>
                ) : (
                  <Text style={styles.gapGood}>{t('readiness.gapGood')}</Text>
                )}
              </>
            )}
          </PremiumFeatureCard>
        </View>
      ) : null}

      {(data.focusNext ?? []).length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title={t('readiness.focusNext')} />
          <PremiumFeatureCard style={styles.focusCard}>
            {data.focusNext!.map((item) => (
              <Text key={item} style={styles.focusItem}>
                • {item}
              </Text>
            ))}
          </PremiumFeatureCard>
        </View>
      ) : null}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    centered: { alignItems: 'center', justifyContent: 'center' },
    emptyWrap: {
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xl,
    },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary, textAlign: 'center' },
    heroRingWrap: { alignItems: 'center', zIndex: 1 },
    assessed: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      zIndex: 1,
    },
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
