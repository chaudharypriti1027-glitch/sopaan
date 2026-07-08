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
import {
  Card,
  ChipSelect,
  PremiumEmptyState,
  PremiumListRow,
  QueryStateView,
  Screen,
  SectionTitle,
  TextField,
} from '../../components';
import type { SearchResult, SearchResultGroup } from '../../api/search';
import { useNetworkStatus, useRecentSearches, useSearch } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import { useTheme } from '../../theme';

type SearchNav = NativeStackNavigationProp<MainStackParamList, 'Search'>;

const GROUP_LABELS: Record<SearchResultGroup, string> = {
  exams: 'Exams',
  courses: 'Courses',
  tests: 'Tests & mocks',
  ai: 'Ask AI',
};

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

export function SearchScreen() {
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
    <Screen scroll contentContainerStyle={styles.content}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search courses, tests, exams…"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />

      {debouncedQuery.length === 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionTitle title="Recent" />
            {recent.length > 0 ? (
              <Pressable onPress={() => void clearRecent()}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          {recent.length === 0 ? (
            <PremiumEmptyState
              title="No recent searches"
              hint="Your recent searches will appear here."
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
              title="No results"
              hint={`Nothing matched “${debouncedQuery}”. Try a different keyword.`}
              Icon={SearchIcon}
              tone="slate"
            />
          ) : (
            GROUP_ORDER.map((group) => {
              const items = searchQuery.data?.results[group] ?? [];
              if (!items.length) return null;

              return (
                <View key={group} style={styles.section}>
                  <SectionTitle title={GROUP_LABELS[group]} />
                  <Card padded={false}>
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
                  </Card>
                </View>
              );
            })
          )}
        </QueryStateView>
      ) : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.xl,
      paddingBottom: theme.spacing['4xl'],
    },
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
  });
}
