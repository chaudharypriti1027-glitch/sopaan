import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BookOpen,
  GraduationCap,
  Landmark,
  Search as SearchIcon,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  ChipSelect,
  FeatureScreenLayout,
  PremiumEmptyState,
  PremiumFeatureCard,
  PremiumListRow,
  PremiumSectionLabel,
  QueryStateView,
  TextField,
} from '../../components';
import type { SearchResult, SearchResultGroup } from '../../api/search';
import { useNetworkStatus, useRecentSearches, useSearch } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import { useTheme } from '../../theme';

type SearchNav = NativeStackNavigationProp<MainStackParamList, 'Search'>;

const GROUP_ORDER: SearchResultGroup[] = ['exams', 'courses', 'tests', 'ai'];

const GROUP_TONES = {
  exams: 'coral',
  courses: 'indigo',
  tests: 'teal',
  ai: 'gold',
} as const satisfies Record<SearchResultGroup, 'coral' | 'indigo' | 'teal' | 'gold'>;

const GROUP_ICONS: Record<SearchResultGroup, LucideIcon> = {
  exams: Landmark,
  courses: GraduationCap,
  tests: BookOpen,
  ai: Sparkles,
};

const GROUP_LABEL_KEYS: Record<SearchResultGroup, string> = {
  exams: 'search.groupExams',
  courses: 'search.groupCourses',
  tests: 'search.groupTests',
  ai: 'search.groupAi',
};

export function SearchScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<SearchNav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { recent, addRecent, clearRecent } = useRecentSearches();
  const { isOffline } = useNetworkStatus();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useSearch(debouncedQuery, debouncedQuery.length > 0);

  const openResult = (result: SearchResult) => {
    const saveLabel =
      result.group === 'ai' && debouncedQuery ? debouncedQuery : result.title;
    void addRecent(saveLabel);

    switch (result.route) {
      case 'AppTabs':
        navigation.navigate('AppTabs', { screen: 'Home' });
        break;
      case 'ExamDetail':
        navigation.navigate('ExamDetail', { examId: result.routeParams?.examId });
        break;
      case 'Quiz':
        navigation.navigate('Quiz', { testId: result.routeParams?.testId ?? result.id });
        break;
      case 'AskAI':
        navigateToAskAI(
          navigation,
          debouncedQuery.trim() ? { initialPrompt: debouncedQuery.trim() } : undefined,
        );
        break;
      case 'CourseDetail':
        navigation.navigate('CourseDetail', {
          courseId: result.routeParams?.courseId ?? result.id,
        });
        break;
      default:
        break;
    }
  };

  const hasResults =
    debouncedQuery.length > 0 &&
    !searchQuery.isError &&
    GROUP_ORDER.some((group) => (searchQuery.data?.results[group]?.length ?? 0) > 0);

  return (
    <FeatureScreenLayout title={t('search.title')} subtitle={t('search.subtitle')}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder={t('search.placeholder')}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />

      {debouncedQuery.length === 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PremiumSectionLabel title={t('search.recent')} compact />
            {recent.length > 0 ? (
              <Pressable onPress={() => void clearRecent()}>
                <Text style={styles.clearText}>{t('search.clear')}</Text>
              </Pressable>
            ) : null}
          </View>
          {recent.length === 0 ? (
            <PremiumEmptyState
              title={t('search.emptyRecentTitle')}
              hint={t('search.emptyRecent')}
              Icon={SearchIcon}
              tone="slate"
            />
          ) : (
            <View style={styles.chipRow}>
              {recent.map((item) => (
                <ChipSelect key={item} label={item} onPress={() => setQuery(item)} />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {debouncedQuery.length > 0 ? (
        <QueryStateView
          isLoading={searchQuery.isLoading}
          isError={searchQuery.isError}
          isFetching={searchQuery.isFetching}
          isOffline={isOffline}
          hasData={hasResults}
          onRetry={() => void searchQuery.refetch()}
          skeletonRows={2}
        >
          {!hasResults ? (
            <PremiumEmptyState
              title={t('search.noResults', { query: debouncedQuery })}
              Icon={SearchIcon}
              tone="slate"
            />
          ) : (
            GROUP_ORDER.map((group) => {
              const items = searchQuery.data?.results[group] ?? [];
              if (!items.length) return null;

              return (
                <View key={group} style={styles.section}>
                  <PremiumSectionLabel title={t(GROUP_LABEL_KEYS[group])} compact />
                  <PremiumFeatureCard style={styles.resultCard}>
                    {items.map((item: SearchResult, index: number) => (
                      <PremiumListRow
                        key={item.id}
                        title={item.title}
                        subtitle={item.subtitle}
                        icon={GROUP_ICONS[group]}
                        tone={GROUP_TONES[group]}
                        onPress={() => openResult(item)}
                        last={index === items.length - 1}
                      />
                    ))}
                  </PremiumFeatureCard>
                </View>
              );
            })
          )}
        </QueryStateView>
      ) : null}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    section: {
      gap: theme.spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    clearText: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    resultCard: {
      padding: 0,
      overflow: 'hidden',
    },
  });
}
