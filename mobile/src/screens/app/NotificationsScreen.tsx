import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell } from 'lucide-react-native';
import { useMemo } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Card,
  FeatureScreenLayout,
  PremiumEmptyState,
  PremiumHeroCard,
  PremiumListRow,
  PremiumSectionLabel,
  QueryStateView,
} from '../../components';
import { useGroupedNotifications, useMarkNotificationRead, useNetworkStatus } from '../../hooks';
import { openInAppNotification } from '../../hooks/useNotificationDeepLink';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { HomeSlotIcon } from '../../components/home/HomePremiumIcon';

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { grouped, isLoading, isError, isFetching, isRefetching, refetch, unreadCount } =
    useGroupedNotifications();
  const markRead = useMarkNotificationRead();
  const { isOffline } = useNetworkStatus();

  const hasNotifications = grouped.today.length > 0 || grouped.earlier.length > 0;

  const handlePress = (item: (typeof grouped.today)[number]) => {
    if (!item.read) {
      markRead.mutate(item.id);
    }

    openInAppNotification(navigation, {
      type: item.type,
      data: item.data ?? undefined,
    });
  };

  const renderGroup = (title: string, items: typeof grouped.today) => {
    if (!items.length) return null;

    return (
      <View style={styles.section}>
        <PremiumSectionLabel title={title} compact />
        <Card padded={false}>
          {items.map((item, index) => (
            <PremiumListRow
              key={item.id}
              title={item.title}
              subtitle={item.body}
              meta={formatTime(item.createdAt)}
              icon={Bell}
              tone="gold"
              unread={!item.read}
              onPress={() => handlePress(item)}
              last={index === items.length - 1}
            />
          ))}
        </Card>
      </View>
    );
  };

  return (
    <FeatureScreenLayout
      title={t('notifications.title')}
      subtitle={t('notifications.subtitle')}
      scrollProps={{
        refreshControl: <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />,
      }}
      contentStyle={styles.content}
    >
      <PremiumHeroCard
        icon={<HomeSlotIcon slot="featured" Icon={Bell} tone="gold" />}
        eyebrow={t('notifications.inbox')}
        title={unreadCount > 0 ? t('notifications.unread', { count: unreadCount }) : t('notifications.allCaughtUp')}
        hint={t('notifications.subtitle')}
      />

      <QueryStateView
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        isOffline={isOffline}
        hasData={hasNotifications}
        onRetry={() => void refetch()}
      >
        {renderGroup(t('notifications.today'), grouped.today)}
        {renderGroup(t('notifications.earlier'), grouped.earlier)}
        {!hasNotifications ? (
          <PremiumEmptyState
            title={t('notifications.emptyTitle')}
            hint={t('notifications.emptyHint')}
            Icon={Bell}
            tone="gold"
          />
        ) : null}
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing['4xl'],
    },
    section: {
      gap: theme.spacing.sm,
    },
  });
}
