import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
} from 'lucide-react-native';
import { Card, ChipSelect, Screen, TextField } from '../../components';
import type { SearchResult, SearchResultGroup } from '../../api/search';
import { useRecentSearches, useSearch } from '../../hooks';
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

function GroupIcon({ group, color }: { group: SearchResultGroup; color: string }) {
  const size = 18;
  switch (group) {
    case 'exams':
      return <Landmark size={size} color={color} />;
    case 'courses':
      return <GraduationCap size={size} color={color} />;
    case 'tests':
      return <BookOpen size={size} color={color} />;
    case 'ai':
      return <Sparkles size={size} color={color} />;
  }
}

export function SearchScreen() {
  const navigation = useNavigation<SearchNav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { recent, addRecent, clearRecent } = useRecentSearches();
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
        navigateToAskAI(navigation);
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
            <Text style={styles.sectionTitle}>Recent</Text>
            {recent.length > 0 ? (
              <Pressable onPress={() => void clearRecent()}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>Your recent searches will appear here.</Text>
          ) : (
            <View style={styles.chipRow}>
              {recent.map((item) => (
                <ChipSelect key={item} label={item} onPress={() => setQuery(item)} />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {searchQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} style={styles.loader} />
      ) : null}

      {debouncedQuery.length > 0 && !searchQuery.isLoading && !hasResults ? (
        <Text style={styles.emptyText}>No results for “{debouncedQuery}”.</Text>
      ) : null}

      {GROUP_ORDER.map((group) => {
        const items = searchQuery.data?.results[group] ?? [];
        if (!items.length) return null;

        return (
          <View key={group} style={styles.section}>
            <Text style={styles.sectionTitle}>{GROUP_LABELS[group]}</Text>
            <Card padded={false}>
              {items.map((item: SearchResult, index: number) => (
                <Pressable
                  key={item.id}
                  onPress={() => openResult(item)}
                  style={({ pressed }) => [
                    styles.resultRow,
                    index < items.length - 1 && styles.resultBorder,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.resultIcon}>
                    <GroupIcon group={group} color={theme.colors.brand.primary} />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                  <SearchIcon size={16} color={theme.colors.text.tertiary} />
                </Pressable>
              ))}
            </Card>
          </View>
        );
      })}
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
    sectionTitle: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    clearText: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    emptyText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    loader: {
      marginTop: theme.spacing.lg,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    resultBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    pressed: {
      backgroundColor: theme.colors.surface.muted,
    },
    resultIcon: {
      width: 36,
      height: 36,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.brand.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultText: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    resultTitle: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    resultSubtitle: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
  });
}
