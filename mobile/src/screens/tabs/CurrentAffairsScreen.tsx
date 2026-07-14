import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Text } from '../../components';
import { PREMIUM } from '../../components/premium';
import {
  CA_CATEGORY_OPTIONS,
  CA_UI,
  CaCategoryPills,
  CaFeedHeader,
  CaFilterBar,
  CaFilterSheet,
  CaHeader,
  CaQuizBanner,
  CaStatsRow,
  CurrentAffairCard,
  type CaCategoryKey,
} from '../../components/currentAffairs';
import {
  isPublishedToday,
  isTrendingAffair,
  sortAffairs,
  hasAffairQuiz,
  type CaSortMode,
} from '../../components/currentAffairs/caUtils';
import { toggleSavedAffair, listSavedAffairIds } from '../../affairs/savedAffairs';
import { cacheAffair, removeCachedAffair } from '../../affairs/offlineAffairCache';
import { currentAffairsApi } from '../../api';
import { useCurrentAffairs, useGroupedNotifications, useProfile } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import type { AppTabParamList, MainStackParamList } from '../../navigation/types';
import type { CurrentAffair } from '../../api/types';
import { INDIAN_STATES_ALL } from '../../screens/profileSetup/constants';
import { buildMonthFilterOptions, currentMonthKey } from '../../utils/monthFilter';

type CANav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'CurrentAffairs'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type SheetKind = 'state' | 'month' | null;

export function CurrentAffairsScreen() {
  const navigation = useNavigation<CANav>();
  const route = useRoute<RouteProp<AppTabParamList, 'CurrentAffairs'>>();
  const { t } = useTranslation(['app', 'common']);
  const { formatDate } = useFormat();
  const { data: profileData } = useProfile();
  const { unreadCount } = useGroupedNotifications();
  const profileState = profileData?.profile?.state;
  const styles = useMemo(() => createStyles(), []);
  const monthOptions = useMemo(() => buildMonthFilterOptions(6), []);

  const [month, setMonth] = useState(currentMonthKey());
  const [state, setState] = useState('National');
  const [category, setCategory] = useState<CaCategoryKey>('all');
  const [sortMode, setSortMode] = useState<CaSortMode>('latest');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<SheetKind>(null);

  useEffect(() => {
    if (profileState) {
      setState(profileState);
    }
  }, [profileState]);

  useEffect(() => {
    const affairId = route.params?.affairId;
    if (!affairId) {
      return;
    }

    navigation.getParent()?.navigate('CurrentAffairReader', { affairId });
    navigation.setParams({ affairId: undefined });
  }, [navigation, route.params?.affairId]);

  useEffect(() => {
    const digestId = route.params?.digestId;
    if (!digestId) {
      return;
    }

    void (async () => {
      try {
        const digest = await currentAffairsApi.getTodayDigest();
        if (digest.id === digestId) {
          setCategory('all');
          setSortMode('latest');
          const firstAffair = digest.affairs?.[0];
          if (firstAffair?.id) {
            navigation.getParent()?.navigate('CurrentAffairReader', { affairId: firstAffair.id });
          }
        }
      } catch {
        // Digest may not be published yet — stay on feed.
      } finally {
        navigation.setParams({ digestId: undefined });
      }
    })();
  }, [navigation, route.params?.digestId]);

  const selectedCategory = CA_CATEGORY_OPTIONS.find((item) => item.key === category);
  const affairsQuery = useCurrentAffairs({
    month,
    state,
    category: selectedCategory?.apiValue ?? undefined,
    limit: 25,
  });

  const refreshSaved = useCallback(async () => {
    setSavedIds(await listSavedAffairIds());
  }, []);

  const onRefresh = async () => {
    await Promise.all([affairsQuery.refetch(), refreshSaved()]);
  };

  useEffect(() => {
    void refreshSaved();
  }, [refreshSaved]);

  const rawItems = useMemo(() => affairsQuery.data?.items ?? [], [affairsQuery.data]);
  const items = useMemo(() => sortAffairs(rawItems, sortMode), [rawItems, sortMode]);
  const total = affairsQuery.data?.pagination?.total ?? rawItems.length;
  const todayCount = useMemo(() => rawItems.filter(isPublishedToday).length, [rawItems]);
  const trendingCount = useMemo(() => rawItems.filter(isTrendingAffair).length, [rawItems]);
  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);
  const isInitialLoad = affairsQuery.isLoading && !affairsQuery.data;
  const showError = affairsQuery.isError && !affairsQuery.data;
  const hasQuiz = rawItems.some((item) => hasAffairQuiz(item));

  const monthLabel = useCallback(
    (value: string) => {
      if (value === currentMonthKey()) {
        return t('currentAffairs.thisMonth');
      }
      const [year, monthNum] = value.split('-').map(Number);
      return formatDate(new Date(year, monthNum - 1, 1), { month: 'short', year: 'numeric' });
    },
    [formatDate, t],
  );

  const stateLabel = state === 'National' ? t('currentAffairs.national') : state;

  const stateOptions = useMemo(
    () =>
      ['National', ...INDIAN_STATES_ALL].map((value) => ({
        value,
        label: value === 'National' ? t('currentAffairs.national') : value,
      })),
    [t],
  );

  const monthSheetOptions = useMemo(
    () =>
      monthOptions.map(({ value }) => ({
        value,
        label: monthLabel(value),
      })),
    [monthLabel, monthOptions],
  );

  const handleToggleSave = useCallback(
    async (id: string) => {
      const wasSaved = savedIdSet.has(id);
      const nowSaved = await toggleSavedAffair(id);

      if (nowSaved) {
        try {
          const affair = await currentAffairsApi.getCurrentAffair(id);
          await cacheAffair(affair);
        } catch {
          /* cache on next open */
        }
      } else if (wasSaved) {
        await removeCachedAffair(id);
      }

      await refreshSaved();
    },
    [refreshSaved, savedIdSet],
  );

  const openArticle = useCallback(
    (affairId: string) => {
      navigation.getParent()?.navigate('CurrentAffairReader', { affairId });
    },
    [navigation],
  );

  const sortLabel =
    sortMode === 'trending'
      ? t('currentAffairs.sortTrending', { count: items.length })
      : t('currentAffairs.sortLatest', { count: items.length });

  const renderItem = useCallback(
    ({ item }: { item: CurrentAffair }) => (
      <CurrentAffairCard
        item={item}
        saved={savedIdSet.has(item.id)}
        onPress={() => openArticle(item.id)}
        onToggleSave={() => handleToggleSave(item.id)}
        categoryLabel={item.category ?? t('currentAffairs.general')}
        formattedDate={
          item.publishedAt
            ? formatDate(item.publishedAt, { day: 'numeric', month: 'short' })
            : ''
        }
      />
    ),
    [formatDate, handleToggleSave, openArticle, savedIdSet, t],
  );

  const listHeader = (
    <View style={styles.headerBody}>
      <CaFeedHeader>
        <CaHeader
          onAskAi={() => navigateToAskAI(navigation)}
          onNotifications={() => navigation.getParent()?.navigate('Notifications')}
          hasUnread={unreadCount > 0}
        />
        <CaStatsRow total={total} today={todayCount} trending={trendingCount} />
        <CaFilterBar
          stateLabel={stateLabel}
          monthLabel={monthLabel(month)}
          sortMode={sortMode}
          onStatePress={() => setActiveSheet('state')}
          onMonthPress={() => setActiveSheet('month')}
          onSortToggle={() => setSortMode((prev) => (prev === 'latest' ? 'trending' : 'latest'))}
        />
        <CaCategoryPills selected={category} onSelect={setCategory} />
      </CaFeedHeader>

      <View style={styles.feedSection}>
        <Text style={styles.sortLabel}>{sortLabel}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.getParent()?.navigate('Books')}
          style={({ pressed }) => [styles.studyCard, pressed && styles.studyCardPressed]}
          testID="ca-study-pdfs"
        >
          <Text style={styles.studyTitle}>{t('currentAffairs.studyPdfsTitle')}</Text>
          <Text style={styles.studySubtitle}>{t('currentAffairs.studyPdfsSubtitle')}</Text>
        </Pressable>

        {hasQuiz ? (
          <CaQuizBanner onPress={() => navigation.navigate('Practice')} />
        ) : null}

        {isInitialLoad ? (
          <ActivityIndicator color={CA_UI.gold} style={styles.loader} />
        ) : null}

        {showError ? (
          <View style={styles.errorBox}>
            <Text style={styles.emptyText}>{t('currentAffairs.loadFailed')}</Text>
            <Pressable onPress={() => void affairsQuery.refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>{t('common:retry')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlashList
        data={showError || isInitialLoad ? [] : items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !isInitialLoad && !showError ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{t('currentAffairs.emptyTitle')}</Text>
              <Text style={styles.emptyText}>{t('currentAffairs.emptyBody')}</Text>
            </View>
          ) : null
        }
        estimatedItemSize={230}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={affairsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={CA_UI.gold}
            colors={[CA_UI.gold]}
          />
        }
      />

      <CaFilterSheet
        visible={activeSheet === 'state'}
        title={t('currentAffairs.selectState')}
        options={stateOptions}
        selectedValue={state}
        onSelect={setState}
        onClose={() => setActiveSheet(null)}
      />
      <CaFilterSheet
        visible={activeSheet === 'month'}
        title={t('currentAffairs.selectMonth')}
        options={monthSheetOptions}
        selectedValue={month}
        onSelect={setMonth}
        onClose={() => setActiveSheet(null)}
      />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: CA_UI.bg,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: PREMIUM.tabBottomPadding,
    },
    headerBody: {
      paddingBottom: 4,
    },
    feedSection: {
      paddingTop: 6,
    },
    sortLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: CA_UI.muted,
      letterSpacing: 0.2,
      marginBottom: 12,
    },
    studyCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CA_UI.border,
      backgroundColor: CA_UI.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
      gap: 4,
    },
    studyCardPressed: {
      opacity: 0.94,
    },
    studyTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: CA_UI.text,
    },
    studySubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: CA_UI.muted,
    },
    loader: { marginVertical: 24 },
    errorBox: {
      gap: 12,
      alignItems: 'center',
      paddingVertical: 20,
    },
    retryBtn: {
      backgroundColor: CA_UI.accent,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    emptyBox: {
      gap: 8,
      alignItems: 'center',
      paddingVertical: 36,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: CA_UI.text,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: '500',
      color: CA_UI.muted,
      textAlign: 'center',
      lineHeight: 19,
    },
  });
}
