import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Card, QueryStateView, Screen, SectionTitle } from '../../components';
import { useNetworkStatus, useSuccessStories } from '../../hooks';
import { useTheme } from '../../theme';

export function SuccessStoriesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isOffline } = useNetworkStatus();

  const storiesQuery = useSuccessStories();
  const stories = storiesQuery.data?.items ?? [];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Success stories" subtitle="Real journeys from Sopaan learners" />

      <QueryStateView
        isLoading={storiesQuery.isLoading}
        isError={storiesQuery.isError}
        isFetching={storiesQuery.isFetching}
        isOffline={isOffline}
        hasData={stories.length > 0}
        onRetry={() => void storiesQuery.refetch()}
      >
        <View style={styles.list}>
          {stories.map((story) => (
            <Card key={story.id} style={styles.card}>
              <Avatar name={story.name} size="md" />
              <View style={styles.body}>
                <Text style={styles.name}>{story.name}</Text>
                <Text style={styles.exam}>
                  {story.exam} · {story.rank}
                </Text>
                <Text style={styles.quote}>&ldquo;{story.quote}&rdquo;</Text>
              </View>
            </Card>
          ))}
        </View>
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    list: { gap: theme.spacing.md },
    card: { flexDirection: 'row', gap: theme.spacing.md },
    body: { flex: 1, gap: theme.spacing.xs },
    name: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    exam: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    quote: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      fontStyle: 'italic',
      marginTop: theme.spacing.xs,
    },
  });
}
