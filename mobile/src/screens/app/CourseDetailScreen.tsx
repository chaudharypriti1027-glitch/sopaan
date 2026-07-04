import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { CheckCircle2, Circle, Download, FileText, GraduationCap, Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, PremiumHeroCard, QueryStateView, Screen, SectionTitle } from '../../components';
import { useCourse, useLessonDownloads, useNetworkStatus, useUpdateCourseProgress } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type CourseDetailRoute = RouteProp<MainStackParamList, 'CourseDetail'>;

function lessonId(lesson: { id?: string; _id?: string }): string {
  return lesson.id ?? lesson._id ?? '';
}

export function CourseDetailScreen() {
  const route = useRoute<CourseDetailRoute>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isOffline } = useNetworkStatus();

  const courseQuery = useCourse(route.params.courseId);
  const updateProgress = useUpdateCourseProgress();
  const downloads = useLessonDownloads(route.params.courseId);

  const course = courseQuery.data;
  const completed = new Set(
    (course?.progress?.completedLessons ?? []).map((id) => id.toString()),
  );

  const toggleLesson = (id: string, isCompleted: boolean) => {
    if (isOffline) {
      Alert.alert('Offline', 'Lesson progress syncs when you are back online.');
      return;
    }

    updateProgress.mutate({
      courseId: route.params.courseId,
      lessonId: id,
      completed: !isCompleted,
    });
  };

  const handleDownloadVideo = (input: {
    lessonId: string;
    lessonTitle: string;
    videoUrl?: string;
  }) => {
    if (!input.videoUrl) {
      Alert.alert('No video', 'This lesson does not have a downloadable video.');
      return;
    }

    void downloads
      .downloadVideo({
        lessonId: input.lessonId,
        lessonTitle: input.lessonTitle,
        videoUrl: input.videoUrl,
      })
      .catch(() => Alert.alert('Download failed', 'Try again when you have a stable connection.'));
  };

  const handleDownloadNotes = (input: {
    lessonId: string;
    lessonTitle: string;
    notes?: string;
  }) => {
    if (!input.notes?.trim()) {
      Alert.alert('No notes', 'This lesson does not have notes to download.');
      return;
    }

    void downloads
      .downloadNotes({
        lessonId: input.lessonId,
        lessonTitle: input.lessonTitle,
        notes: input.notes,
      })
      .catch(() => Alert.alert('Save failed', 'Could not save lesson notes offline.'));
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <QueryStateView
        isLoading={courseQuery.isLoading}
        isError={courseQuery.isError}
        isFetching={courseQuery.isFetching}
        isOffline={isOffline}
        hasData={Boolean(course)}
        onRetry={() => void courseQuery.refetch()}
      >
        {course ? (
          <>
            <PremiumHeroCard
              icon={<GraduationCap size={24} color="#FFFFFF" strokeWidth={1.8} />}
              eyebrow={course.subject ?? 'Course'}
              title={course.title}
              stats={[
                {
                  label: 'Progress',
                  value: `${Math.round(course.progress?.progressPercent ?? course.progressPercent ?? 0)}%`,
                },
                { label: 'Completed', value: `${completed.size}/${(course.lessons ?? []).length}` },
              ]}
            />

            <SectionTitle title="Lessons" subtitle="Download videos and notes for offline study" />
            <Card style={styles.lessons}>
              {[...(course.lessons ?? [])]
                .sort((a, b) => a.order - b.order)
                .map((lesson) => {
                  const id = lessonId(lesson);
                  const done = completed.has(id);
                  const videoStatus = downloads.getStatus(id, 'video');
                  const notesStatus = downloads.getStatus(id, 'notes');

                  return (
                    <View key={id} style={styles.lessonRow}>
                      <Pressable onPress={() => toggleLesson(id, done)} style={styles.lessonMain}>
                        {done ? (
                          <CheckCircle2 size={20} color={theme.colors.semantic.success} />
                        ) : (
                          <Circle size={20} color={theme.colors.text.tertiary} />
                        )}
                        <View style={styles.lessonText}>
                          <Text style={styles.lessonTitle}>{lesson.title}</Text>
                          {lesson.durationSec ? (
                            <Text style={styles.lessonMeta}>
                              {Math.round(lesson.durationSec / 60)} min
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>

                      <View style={styles.downloadActions}>
                        {lesson.videoUrl ? (
                          videoStatus === 'completed' ? (
                            <Pressable
                              onPress={() => void downloads.remove(id, 'video')}
                              style={styles.downloadBtn}
                            >
                              <Trash2 size={16} color={theme.colors.text.tertiary} />
                            </Pressable>
                          ) : (
                            <Button
                              label={videoStatus === 'downloading' ? '…' : 'Video'}
                              size="sm"
                              variant="ghost"
                              icon={<Download size={14} color={theme.colors.brand.primary} />}
                              onPress={() =>
                                handleDownloadVideo({
                                  lessonId: id,
                                  lessonTitle: lesson.title,
                                  videoUrl: lesson.videoUrl,
                                })
                              }
                              loading={videoStatus === 'downloading'}
                              disabled={videoStatus === 'downloading'}
                            />
                          )
                        ) : null}

                        {lesson.notes ? (
                          notesStatus === 'completed' ? (
                            <Pressable
                              onPress={() => void downloads.remove(id, 'notes')}
                              style={styles.downloadBtn}
                            >
                              <FileText size={16} color={theme.colors.semantic.success} />
                            </Pressable>
                          ) : (
                            <Button
                              label={notesStatus === 'downloading' ? '…' : 'Notes'}
                              size="sm"
                              variant="ghost"
                              icon={<FileText size={14} color={theme.colors.brand.primary} />}
                              onPress={() =>
                                handleDownloadNotes({
                                  lessonId: id,
                                  lessonTitle: lesson.title,
                                  notes: lesson.notes,
                                })
                              }
                              loading={notesStatus === 'downloading'}
                              disabled={notesStatus === 'downloading'}
                            />
                          )
                        ) : null}
                      </View>
                    </View>
                  );
                })}
            </Card>
          </>
        ) : null}
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    lessons: { gap: theme.spacing.md },
    lessonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.subtle,
      paddingBottom: theme.spacing.md,
    },
    lessonMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    lessonText: { flex: 1, gap: theme.spacing.xs },
    lessonTitle: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    lessonMeta: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    downloadActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    downloadBtn: { padding: theme.spacing.xs },
  });
}
