import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, Radio, PlayCircle, Trophy } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Pill, PremiumHeroCard, QueryStateView, Screen, SectionTitle } from '../../components';
import { LiveMockLeaderboard } from '../../components/LiveMockLeaderboard';
import { useEnrollTestSeries, useNetworkStatus, useTestSeriesList } from '../../hooks';
import type { MockScheduleState, TestSeriesMock } from '../../api/testSeries';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type SeriesNav = NativeStackNavigationProp<MainStackParamList, 'TestSeries'>;

function stateLabel(state: MockScheduleState): string {
  if (state === 'locked') return 'Locked';
  if (state === 'live') return 'Live';
  return 'Available';
}

function stateVariant(state: MockScheduleState): 'muted' | 'gold' | 'teal' {
  if (state === 'locked') return 'muted';
  if (state === 'live') return 'gold';
  return 'teal';
}

function MockRow({
  mock,
  enrolled,
  onStart,
}: {
  mock: TestSeriesMock;
  enrolled: boolean;
  onStart: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createMockStyles(theme), [theme]);

  const Icon = mock.state === 'locked' ? Lock : mock.state === 'live' ? Radio : PlayCircle;
  const canStart = enrolled && mock.state !== 'locked';

  return (
    <Pressable
      onPress={canStart ? onStart : undefined}
      style={({ pressed }) => [styles.row, pressed && canStart && styles.pressed]}
    >
      <View style={[styles.iconWrap, mock.state === 'live' && styles.iconLive]}>
        <Icon
          size={18}
          color={mock.state === 'locked' ? theme.colors.text.tertiary : theme.colors.brand.primary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>Mock {mock.index}: {mock.title}</Text>
        <Text style={styles.meta}>
          Unlocks {new Date(mock.unlockDate).toLocaleDateString('en-IN')}
          {mock.durationSec ? ` · ${Math.round(mock.durationSec / 60)} min` : ''}
        </Text>
      </View>
      <Pill label={stateLabel(mock.state)} variant={stateVariant(mock.state)} />
    </Pressable>
  );
}

export function TestSeriesScreen() {
  const navigation = useNavigation<SeriesNav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const seriesQuery = useTestSeriesList({ limit: 20 });
  const enrollMutation = useEnrollTestSeries();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [liveMockId, setLiveMockId] = useState<string | null>(null);

  const activeSeries =
    seriesQuery.data?.items.find((s) => s.id === activeId) ?? seriesQuery.data?.items[0] ?? null;

  const liveMock = activeSeries?.mocks.find((mock) => mock.state === 'live') ?? null;

  const handleEnroll = async (id: string) => {
    await enrollMutation.mutateAsync(id);
    setActiveId(id);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Test series" subtitle="Enroll and follow the mock schedule" />

      <QueryStateView
        isLoading={seriesQuery.isLoading}
        isError={seriesQuery.isError}
        isFetching={seriesQuery.isFetching}
        isOffline={isOffline}
        hasData={(seriesQuery.data?.items.length ?? 0) > 0}
        onRetry={() => void seriesQuery.refetch()}
      >
        <View style={styles.seriesList}>
          {(seriesQuery.data?.items ?? []).map((series) => (
            <Pressable
              key={series.id}
              onPress={() => setActiveId(series.id)}
              style={({ pressed }) => [
                styles.seriesChip,
                activeSeries?.id === series.id && styles.seriesChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.seriesChipText,
                  activeSeries?.id === series.id && styles.seriesChipTextActive,
                ]}
              >
                {series.title}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeSeries ? (
          <View style={styles.detail}>
            <PremiumHeroCard
              icon={<Trophy size={24} color="#FFFFFF" strokeWidth={1.8} />}
              eyebrow={activeSeries.examTag}
              title={activeSeries.title}
              trailing={
                activeSeries.enrolled ? (
                  <Pill label="Enrolled" variant="teal" />
                ) : undefined
              }
              stats={[{ label: 'Mocks', value: String(activeSeries.mockCount) }]}
            >
              {!activeSeries.enrolled ? (
                <Button
                  label={enrollMutation.isPending ? 'Enrolling…' : 'Enroll free'}
                  variant="gold"
                  onPress={() => handleEnroll(activeSeries.id)}
                  disabled={enrollMutation.isPending}
                />
              ) : null}
            </PremiumHeroCard>

            <Card style={styles.scheduleCard}>
              <SectionTitle title="Mock schedule" />
              <View style={styles.schedule}>
                {activeSeries.mocks.map((mock) => (
                  <MockRow
                    key={`${mock.testId}-${mock.index}`}
                    mock={mock}
                    enrolled={activeSeries.enrolled}
                    onStart={() => {
                      if (mock.state === 'live') {
                        setLiveMockId(mock.testId);
                      }
                      navigation.navigate('Quiz', { testId: mock.testId });
                    }}
                  />
                ))}
              </View>

              {liveMock || liveMockId ? (
                <LiveMockLeaderboard
                  testId={liveMock?.testId ?? liveMockId ?? ''}
                  title={liveMock ? `Live: ${liveMock.title}` : 'Live leaderboard'}
                />
              ) : null}
            </Card>
          </View>
        ) : (
          <Text style={styles.empty}>No test series available yet.</Text>
        )}
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    seriesList: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    seriesChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.full,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.surface.default,
    },
    seriesChipActive: {
      borderColor: theme.colors.brand.primary,
      backgroundColor: theme.colors.brand.primaryMuted,
    },
    seriesChipText: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    seriesChipTextActive: {
      color: theme.colors.brand.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    pressed: { opacity: 0.92 },
    detail: { gap: theme.spacing.md },
    scheduleCard: { gap: theme.spacing.md },
    schedule: { gap: theme.spacing.sm },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}

function createMockStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    pressed: { opacity: 0.92 },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLive: { backgroundColor: theme.colors.accent.goldMuted },
    info: { flex: 1, gap: theme.spacing.xs },
    title: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    meta: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
  });
}
