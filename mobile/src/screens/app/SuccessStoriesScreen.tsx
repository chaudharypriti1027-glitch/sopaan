import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card, Screen, SectionTitle } from '../../components';
import { useSuccessStories } from '../../hooks';
import { useTheme } from '../../theme';

export function SuccessStoriesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const storiesQuery = useSuccessStories();

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Success stories" subtitle="Real journeys from Sopaan learners" />

      {storiesQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <View style={styles.list}>
          {(storiesQuery.data?.items ?? []).map((story) => (
            <Card key={story.id} style={styles.card}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: story.imageColor ?? theme.colors.brand.primaryMuted },
                ]}
              >
                <Text style={styles.initial}>{story.name.charAt(0)}</Text>
              </View>
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
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    list: { gap: theme.spacing.md },
    card: { flexDirection: 'row', gap: theme.spacing.md },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.brand.primary,
    },
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
