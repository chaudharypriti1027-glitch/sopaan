import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { CheckCircle2, Circle, Download, FileText, GraduationCap, Paperclip, Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FeatureScreenLayout,
  PremiumFeatureCard,
  PremiumHeroCard,
  QueryStateView,
  SectionTitle,
} from '../../components';
import { useCourse, useLessonDownloads, useNetworkStatus, useUpdateCourseProgress } from '../../hooks';
import { resolveLessonMaterial } from '../../lib/lessonMaterial';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type CourseDetailRoute = RouteProp<MainStackParamList, 'CourseDetail'>;

function lessonId(lesson: { id?: string; _id?: string }): string {
  return lesson.id ?? lesson._id ?? '';
}

export function CourseDetailScreen() {
  const { t } = useTranslation('app');
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
      Alert.alert(t('courseDetail.offlineTitle'), t('courseDetail.offlineBody'));
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
      Alert.alert(t('courseDetail.noVideo'), t('courseDetail.noVideoBody'));
      return;
    }

    void downloads
      .downloadVideo({
        lessonId: input.lessonId,
        lessonTitle: input.lessonTitle,
        videoUrl: input.videoUrl,
      })
      .catch(() =>
        Alert.alert(t('courseDetail.downloadFailed'), t('courseDetail.downloadFailedBody')),
      );
  };

  const handleDownloadNotes = (input: {
    lessonId: string;
    lessonTitle: string;
    notes?: string;
  }) => {
    if (!input.notes?.trim()) {
      Alert.alert(t('courseDetail.noNotes'), t('courseDetail.noNotesBody'));
      return;
    }

    void downloads
      .downloadNotes({
        lessonId: input.lessonId,
        lessonTitle: input.lessonTitle,
        notes: input.notes,
      })
      .catch(() => Alert.alert(t('courseDetail.saveFailed'), t('courseDetail.saveFailedBody')));
  };

  const handleDownloadMaterial = (input: {
    lessonId: string;
    lessonTitle: string;
    materialUrl: string;
    materialName?: string;
  }) => {
    void downloads
      .downloadMaterial(input)
      .catch(() =>
        Alert.alert(t('courseDetail.downloadFailed'), t('courseDetail.downloadFailedBody')),
      );
  };

  const handleOpenMaterial = async (input: { localUri?: string; remoteUrl: string }) => {
    const target = input.localUri ?? input.remoteUrl;
    try {
      const supported = await Linking.canOpenURL(target);
      if (!supported) {
        Alert.alert(t('courseDetail.cannotOpenFile'), t('courseDetail.cannotOpenFileBody'));
        return;
      }
      await Linking.openURL(target);
    } catch {
      Alert.alert(t('courseDetail.cannotOpenFile'), t('courseDetail.cannotOpenFileOffline'));
    }
  };

  return (
    <FeatureScreenLayout title={course?.title ?? t('courseDetail.defaultSubject')}>
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
              eyebrow={course.subject ?? t('courseDetail.defaultSubject')}
              title={course.title}
              stats={[
                {
                  label: t('courseDetail.progress'),
                  value: `${Math.round(course.progress?.progressPercent ?? course.progressPercent ?? 0)}%`,
                },
                {
                  label: t('courseDetail.completed'),
                  value: `${completed.size}/${(course.lessons ?? []).length}`,
                },
              ]}
            />

            <SectionTitle
              title={t('courseDetail.lessons')}
              subtitle={t('courseDetail.lessonsSubtitle')}
            />
            <PremiumFeatureCard style={styles.lessons}>
              {[...(course.lessons ?? [])]
                .sort((a, b) => a.order - b.order)
                .map((lesson) => {
                  const id = lessonId(lesson);
                  const done = completed.has(id);
                  const videoStatus = downloads.getStatus(id, 'video');
                  const notesStatus = downloads.getStatus(id, 'notes');
                  const materialStatus = downloads.getStatus(id, 'material');
                  const material = resolveLessonMaterial(lesson);
                  const materialRecord = downloads.records.find(
                    (record) => record.lessonId === id && record.kind === 'material',
                  );

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
                              {t('courseDetail.durationMin', {
                                count: Math.round(lesson.durationSec / 60),
                              })}
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
                              label={videoStatus === 'downloading' ? '…' : t('courseDetail.video')}
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
                              label={notesStatus === 'downloading' ? '…' : t('courseDetail.notes')}
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

                        {material ? (
                          materialStatus === 'completed' ? (
                            <Pressable
                              onPress={() =>
                                void handleOpenMaterial({
                                  localUri: materialRecord?.localUri,
                                  remoteUrl: material.url,
                                })
                              }
                              onLongPress={() => void downloads.remove(id, 'material')}
                              style={styles.downloadBtn}
                            >
                              <Paperclip size={16} color={theme.colors.semantic.success} />
                            </Pressable>
                          ) : (
                            <Button
                              label={materialStatus === 'downloading' ? '…' : t('courseDetail.pdf')}
                              size="sm"
                              variant="ghost"
                              icon={<Download size={14} color={theme.colors.brand.primary} />}
                              onPress={() =>
                                handleDownloadMaterial({
                                  lessonId: id,
                                  lessonTitle: lesson.title,
                                  materialUrl: material.url,
                                  materialName: material.name,
                                })
                              }
                              loading={materialStatus === 'downloading'}
                              disabled={materialStatus === 'downloading'}
                            />
                          )
                        ) : null}
                      </View>
                    </View>
                  );
                })}
            </PremiumFeatureCard>
          </>
        ) : null}
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
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
