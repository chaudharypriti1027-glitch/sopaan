import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card, Screen } from '../../components';
import { useGroupedNotifications, useMarkNotificationRead } from '../../hooks';
import { openInAppNotification } from '../../hooks/useNotificationDeepLink';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { grouped, isLoading, isRefetching, refetch, unreadCount } = useGroupedNotifications();
  const markRead = useMarkNotificationRead();

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
        <Text style={styles.sectionTitle}>{title}</Text>
        <Card padded={false}>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => handlePress(item)}
              style={({ pressed }) => [
                styles.row,
                index < items.length - 1 && styles.rowBorder,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.rowContent}>
                <View style={styles.titleRow}>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                  <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
                </View>
                {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
            </Pressable>
          ))}
        </Card>
      </View>
    );
  };

  return (
    <Screen
      scroll
      scrollProps={{
        refreshControl: <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />,
      }}
      contentContainerStyle={styles.content}
    >
      {unreadCount > 0 ? (
        <Text style={styles.unreadBanner}>{unreadCount} unread</Text>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <>
          {renderGroup('Today', grouped.today)}
          {renderGroup('Earlier', grouped.earlier)}
          {!grouped.today.length && !grouped.earlier.length ? (
            <Text style={styles.empty}>You’re all caught up — no notifications yet.</Text>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.xl,
      paddingBottom: theme.spacing['4xl'],
    },
    unreadBanner: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
    section: {
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    row: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    pressed: {
      backgroundColor: theme.colors.surface.muted,
    },
    rowContent: {
      gap: theme.spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.brand.primary,
    },
    title: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      flex: 1,
    },
    titleUnread: {
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    body: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    time: {
      ...theme.typography.presets.label,
      color: theme.colors.text.tertiary,
    },
    empty: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing['3xl'],
    },
  });
}
