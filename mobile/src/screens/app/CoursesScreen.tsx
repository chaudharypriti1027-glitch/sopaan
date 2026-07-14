import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, GraduationCap } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  FeatureScreenLayout,
  Pill,
  PremiumEmptyState,
  PremiumFeatureCard,
  PremiumHeroCard,
  ProgressBar,
  QueryStateView,
} from '../../components';
import { HomeSlotIcon } from '../../components/home/HomePremiumIcon';
import type { Course } from '../../api/types';
import { useCourses, useNetworkStatus } from '../../hooks';
import { useFocusRefetch } from '../../hooks/useFocusRefetch';
import type { MainStackParamList } from '../../navigation/types';
import { toneColors, toneForText } from '../../utils/iconTone';
import { useTheme } from '../../theme';

type CoursesNav = NativeStackNavigationProp<MainStackParamList, 'Courses'>;

type CourseCardProps = {
  course: Course;
  styles: ReturnType<typeof createStyles>;
  primaryColor: string;
  onPress: () => void;
};

function CourseCard({ course, styles, primaryColor, onPress }: CourseCardProps) {
  const { t } = useTranslation('app');
  const tone = toneColors(toneForText(course.subject ?? course.title));

  return (
    <Pressable onPress={onPress}>
      <PremiumFeatureCard style={styles.card}>
        <View
          style={[
            styles.thumb,
            { backgroundColor: course.thumbnailColor ?? tone.bg },
          ]}
        >
          <Play
            size={20}
            color={course.thumbnailColor ? primaryColor : tone.fg}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.meta}>
            {course.subject} · {t('courses.lessonCount', { count: course.lessonCount ?? 0 })}
          </Text>
          <ProgressBar
            value={course.progressPercent ?? 0}
            label={t('courses.progress')}
            showValue
            variant="teal"
          />
        </View>
        <Pill label={t('courses.free')} variant="teal" />
      </PremiumFeatureCard>
    </Pressable>
  );
}

export function CoursesScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<CoursesNav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isOffline } = useNetworkStatus();

  const coursesQuery = useCourses({ limit: 30 });
  const freeCourses = (coursesQuery.data?.items ?? []).filter((course) => course.isFree !== false);
  const hasData = freeCourses.length > 0;
  const inProgress = freeCourses.filter((course) => (course.progressPercent ?? 0) > 0).length;

  useFocusRefetch(() => {
    void coursesQuery.refetch();
  });

  return (
    <FeatureScreenLayout title={t('courses.title')} subtitle={t('courses.subtitle')}>
      <PremiumHeroCard
        icon={<HomeSlotIcon slot="featured" Icon={GraduationCap} tone="lavender" />}
        eyebrow={t('courses.title')}
        title={t('courses.availableCount', { count: freeCourses.length })}
        hint={
          inProgress > 0
            ? t('courses.inProgress', { count: inProgress })
            : t('courses.subtitle')
        }
      />

      <QueryStateView
        isLoading={coursesQuery.isLoading}
        isError={coursesQuery.isError}
        isFetching={coursesQuery.isFetching}
        isOffline={isOffline}
        hasData={hasData}
        onRetry={() => void coursesQuery.refetch()}
      >
        {hasData ? (
          <View style={styles.list}>
            {freeCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                styles={styles}
                primaryColor={theme.colors.brand.primary}
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              />
            ))}
          </View>
        ) : (
          <PremiumEmptyState
            title={t('courses.emptyTitle')}
            hint={t('courses.emptyBody')}
            Icon={GraduationCap}
            tone="lavender"
          />
        )}
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
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
