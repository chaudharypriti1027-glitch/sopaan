import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageCircle, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  FeatureScreenLayout,
  PremiumFeatureCard,
  QueryStateView,
  SegTabs,
  TextField,
} from '../../components';
import {
  useFriendRequests,
  useFriends,
  useOpenConversation,
  useNetworkStatus,
  useRemoveFriend,
  useRespondFriendRequest,
  useSearchStudents,
  useSendFriendRequest,
} from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Tab = 'friends' | 'requests' | 'add';

export function FriendsScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tab, setTab] = useState<Tab>('friends');
  const [search, setSearch] = useState('');

  const friendsQuery = useFriends({ limit: 50 });
  const requestsQuery = useFriendRequests({ limit: 30 });
  const searchQuery = useSearchStudents(search, tab === 'add');
  const sendRequest = useSendFriendRequest();
  const respondRequest = useRespondFriendRequest();
  const removeFriend = useRemoveFriend();
  const openConversation = useOpenConversation();
  const { isOffline } = useNetworkStatus();

  const requestCount = requestsQuery.data?.items.length ?? 0;

  const tabs = [
    { key: 'friends' as const, label: t('friends.tabs.friends') },
    {
      key: 'requests' as const,
      label:
        requestCount > 0
          ? t('friends.tabs.requestsWithCount', { count: requestCount })
          : t('friends.tabs.requests'),
    },
    { key: 'add' as const, label: t('friends.tabs.add') },
  ];

  const openChat = async (friendUserId: string, friendName: string) => {
    try {
      const conversation = await openConversation.mutateAsync(friendUserId);
      navigation.navigate('DirectMessage', {
        conversationId: conversation.id,
        friendUserId,
        friendName,
      });
    } catch {
      Alert.alert(t('friends.chatFailed'));
    }
  };

  return (
    <FeatureScreenLayout title={t('friends.title')} subtitle={t('friends.subtitle')}>
      <SegTabs options={tabs} value={tab} onChange={setTab} />

      {tab === 'friends' ? (
        <QueryStateView
          isLoading={friendsQuery.isLoading}
          isError={friendsQuery.isError}
          isFetching={friendsQuery.isFetching}
          isOffline={isOffline}
          hasData={Boolean(friendsQuery.data?.items.length)}
          onRetry={() => void friendsQuery.refetch()}
        >
          {friendsQuery.data?.items.length ? (
            <View style={styles.list}>
              {friendsQuery.data.items.map((friend) => (
                <PremiumFeatureCard key={friend.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Avatar
                      name={friend.name}
                      source={friend.avatarUrl ? { uri: friend.avatarUrl } : undefined}
                      size="md"
                    />
                    <View style={styles.copy}>
                      <Text style={styles.name}>{friend.name}</Text>
                      <Text style={styles.meta}>
                        {friend.targetExam ? friend.targetExam : t('friends.noExam')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      label={t('friends.message')}
                      size="sm"
                      onPress={() => void openChat(friend.id, friend.name)}
                    />
                    <Pressable
                      onPress={() =>
                        Alert.alert(t('friends.removeTitle'), t('friends.removeBody'), [
                          { text: t('friends.cancel'), style: 'cancel' },
                          {
                            text: t('friends.remove'),
                            style: 'destructive',
                            onPress: () => removeFriend.mutate(friend.id),
                          },
                        ])
                      }
                    >
                      <Text style={styles.remove}>{t('friends.remove')}</Text>
                    </Pressable>
                  </View>
                </PremiumFeatureCard>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>{t('friends.emptyFriends')}</Text>
          )}
        </QueryStateView>
      ) : null}

      {tab === 'requests' ? (
        <QueryStateView
          isLoading={requestsQuery.isLoading}
          isError={requestsQuery.isError}
          isFetching={requestsQuery.isFetching}
          isOffline={isOffline}
          hasData={Boolean(requestsQuery.data?.items.length)}
          onRetry={() => void requestsQuery.refetch()}
        >
          {requestsQuery.data?.items.length ? (
            <View style={styles.list}>
              {requestsQuery.data.items.map((request) => (
                <PremiumFeatureCard key={request.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Avatar
                      name={request.fromUser.name}
                      source={
                        request.fromUser.avatarUrl
                          ? { uri: request.fromUser.avatarUrl }
                          : undefined
                      }
                      size="md"
                    />
                    <View style={styles.copy}>
                      <Text style={styles.name}>{request.fromUser.name}</Text>
                      <Text style={styles.meta}>{t('friends.requestHint')}</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      label={t('friends.accept')}
                      size="sm"
                      onPress={() =>
                        respondRequest.mutate({ requestId: request.id, action: 'accept' })
                      }
                    />
                    <Button
                      label={t('friends.reject')}
                      size="sm"
                      variant="ghost"
                      onPress={() =>
                        respondRequest.mutate({ requestId: request.id, action: 'reject' })
                      }
                    />
                  </View>
                </PremiumFeatureCard>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>{t('friends.emptyRequests')}</Text>
          )}
        </QueryStateView>
      ) : null}

      {tab === 'add' ? (
        <View style={styles.addSection}>
          <PremiumFeatureCard style={styles.hintCard}>
            <Text style={styles.hintTitle}>{t('friends.addHintTitle')}</Text>
            <Text style={styles.hintBody}>{t('friends.addHintBody')}</Text>
          </PremiumFeatureCard>
          <TextField
            placeholder={t('friends.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
          />
          {search.trim().length >= 2 && searchQuery.isLoading ? (
            <ActivityIndicator color={theme.colors.brand.primary} />
          ) : null}
          <View style={styles.list}>
            {(searchQuery.data?.items ?? []).map((student) => (
              <PremiumFeatureCard key={student.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Avatar
                    name={student.name}
                    source={student.avatarUrl ? { uri: student.avatarUrl } : undefined}
                    size="md"
                  />
                  <View style={styles.copy}>
                    <Text style={styles.name}>{student.name}</Text>
                    <Text style={styles.meta}>
                      {student.targetExam ?? t('friends.noExam')}
                    </Text>
                  </View>
                </View>
                {student.relationStatus === 'accepted' ? (
                  <Text style={styles.status}>{t('friends.alreadyFriends')}</Text>
                ) : student.relationStatus === 'pending' ? (
                  <Text style={styles.status}>{t('friends.requestSent')}</Text>
                ) : (
                  <Button
                    label={t('friends.add')}
                    size="sm"
                    icon={<UserPlus size={14} color={theme.colors.brand.onPrimary} />}
                    loading={sendRequest.isPending}
                    onPress={() => sendRequest.mutate(student.id)}
                  />
                )}
              </PremiumFeatureCard>
            ))}
          </View>
        </View>
      ) : null}

      <Button
        label={t('friends.openMessages')}
        variant="ghost"
        icon={<MessageCircle size={16} color={theme.colors.brand.primary} />}
        onPress={() => navigation.navigate('Messages')}
      />
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing['2xl'],
    },
    list: {
      gap: theme.spacing.sm,
    },
    row: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    rowMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    name: {
      ...theme.typography.presets.bodyMedium,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    meta: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    remove: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
    },
    status: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
    },
    addSection: {
      gap: theme.spacing.sm,
    },
    hintCard: {
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.surface.muted,
      padding: theme.spacing.md,
    },
    hintTitle: {
      ...theme.typography.presets.bodyMedium,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    hintBody: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    empty: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
    },
  });
}
