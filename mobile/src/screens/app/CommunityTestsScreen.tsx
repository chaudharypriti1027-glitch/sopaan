import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Pill, QueryStateView, Screen, SectionTitle, SegTabs } from '../../components';
import { resolveTestSubjectIcon } from '../../components/home/homeUtils';
import { useCommunityTests, useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import type { TestSummary } from '../../api/types';
import { toneColors, toneForText } from '../../utils/iconTone';
import { useTheme } from '../../theme';

type CommunityNav = NativeStackNavigationProp<MainStackParamList, 'CommunityTests'>;

type CommunityTab = 'browse' | 'mine';

const TABS = [
  { key: 'browse' as const, label: 'Published' },
  { key: 'mine' as const, label: 'Your tests' },
];

function TestCard({ test, onPress }: { test: TestSummary; onPress?: () => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createCardStyles(theme), [theme]);
  const Icon = resolveTestSubjectIcon(test.subject, test.title);
  const tone = toneColors(toneForText(test.subject ?? test.title));

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={[styles.iconTile, { backgroundColor: tone.bg }]}>
          <Icon size={20} color={tone.fg} strokeWidth={2} />
        </View>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={styles.title} numberOfLines={1}>{test.title}</Text>
            <Pill
              label={test.status ?? 'draft'}
              variant={test.status === 'published' ? 'teal' : 'muted'}
            />
          </View>
          <Text style={styles.meta}>
            {test.subject} · {test.questionCount ?? 0} Q · {test.difficulty}
          </Text>
          {test.stats?.attempts != null ? (
            <Text style={styles.stats}>{test.stats.attempts} attempts</Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export function CommunityTestsScreen() {
  const navigation = useNavigation<CommunityNav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tab, setTab] = useState<CommunityTab>('browse');
  const { isOffline } = useNetworkStatus();

  const publishedQuery = useCommunityTests({ published: true, limit: 30 });
  const mineQuery = useCommunityTests({ mine: true, limit: 30 });

  const activeQuery = tab === 'browse' ? publishedQuery : mineQuery;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <SectionTitle title="Community tests" subtitle="Practice tests shared by students" />
        <Button
          label="Create"
          size="sm"
          icon={<Plus size={16} color={theme.colors.text.inverse} />}
          onPress={() => navigation.navigate('CreateTest')}
        />
      </View>

      <SegTabs options={TABS} value={tab} onChange={setTab} />

      <QueryStateView
        isLoading={activeQuery.isLoading}
        isError={activeQuery.isError}
        isFetching={activeQuery.isFetching}
        isOffline={isOffline}
        hasData={(activeQuery.data?.items.length ?? 0) > 0}
        onRetry={() => void activeQuery.refetch()}
      >
        <View style={styles.list}>
          {(activeQuery.data?.items ?? []).map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onPress={
                test.status === 'published'
                  ? () => navigation.navigate('Quiz', { testId: test.id })
                  : undefined
              }
            />
          ))}
          {(activeQuery.data?.items ?? []).length === 0 ? (
            <Text style={styles.empty}>
              {tab === 'browse' ? 'No published community tests yet.' : 'You have not created any tests.'}
            </Text>
          ) : null}
        </View>
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    list: { gap: theme.spacing.md },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary, textAlign: 'center' },
  });
}

function createCardStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    info: { flex: 1, gap: theme.spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    meta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    stats: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
  });
}
