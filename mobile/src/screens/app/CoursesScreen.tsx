import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, ProgressBar, QueryStateView, Screen, SectionTitle } from '../../components';
import { useCourses, useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type CoursesNav = NativeStackNavigationProp<MainStackParamList, 'Courses'>;

export function CoursesScreen() {
  const navigation = useNavigation<CoursesNav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isOffline } = useNetworkStatus();

  const coursesQuery = useCourses({ limit: 30 });
  const freeCourses = (coursesQuery.data?.items ?? []).filter((course) => course.isFree !== false);
  const hasData = freeCourses.length > 0;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Free courses" subtitle="Video lessons with tracked progress" />

      <QueryStateView
        isLoading={coursesQuery.isLoading}
        isError={coursesQuery.isError}
        isFetching={coursesQuery.isFetching}
        isOffline={isOffline}
        hasData={hasData}
        onRetry={() => void coursesQuery.refetch()}
      >
        <View style={styles.list}>
          {freeCourses.map((course) => (
            <Pressable
              key={course.id}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            >
              <Card style={styles.card}>
                <View
                  style={[
                    styles.thumb,
                    { backgroundColor: course.thumbnailColor ?? theme.colors.brand.primaryMuted },
                  ]}
                >
                  <Play size={20} color={theme.colors.brand.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.title}>{course.title}</Text>
                  <Text style={styles.meta}>
                    {course.subject} · {course.lessonCount ?? 0} lessons
                  </Text>
                  <ProgressBar
                    value={course.progressPercent ?? 0}
                    label="Progress"
                    showValue
                    variant="teal"
                  />
                </View>
                <Pill label="Free" variant="teal" />
              </Card>
            </Pressable>
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
    card: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, gap: theme.spacing.sm },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    meta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
  });
}
