import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getRelatedQuestions, type RelatedQuestion } from '../api/questions';
import { Pill } from './Pill';
import { useTheme } from '../theme';

type Props = {
  questionId: string;
  limit?: number;
};

export function RelatedQuestions({ questionId, limit = 3 }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['relatedQuestions', questionId, limit],
    queryFn: () => getRelatedQuestions(questionId, limit),
    enabled: Boolean(questionId),
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={theme.colors.brand.primary} />
      </View>
    );
  }

  if (isError || !data?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Related questions</Text>
      {data.map((item: RelatedQuestion) => (
        <View key={item.id} style={styles.item}>
          <Pill label={item.topic} variant="muted" />
          <Text style={styles.text}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    loading: {
      marginTop: theme.spacing.sm,
      alignItems: 'flex-start',
    },
    title: {
      fontSize: theme.typography.scale.fontSize.sm,
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
    item: {
      gap: theme.spacing.xs,
    },
    text: {
      fontSize: theme.typography.scale.fontSize.sm,
      color: theme.colors.text.primary,
      lineHeight: 20,
    },
  });
}
