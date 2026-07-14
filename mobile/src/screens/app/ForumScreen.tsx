import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageCircle, ThumbsUp, UserPlus, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FeatureScreenLayout,
  PremiumFeatureCard,
  QueryStateView,
  SegTabs,
  TextField,
} from '../../components';
import {
  DEFAULT_EXAM_TAG,
  DEFAULT_FORUM_SUBJECT,
} from '../../content/featureDefaultsContent';
import {
  useCreateDoubt,
  useCreateGroup,
  useDoubts,
  useGroups,
  useJoinGroup,
  useNetworkStatus,
  useVoteDoubt,
} from '../../hooks';
import { useAuth } from '../../auth';
import type { MainStackParamList } from '../../navigation/types';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import { useTheme } from '../../theme';

type ForumNav = NativeStackNavigationProp<MainStackParamList, 'Forum'>;

type ForumTab = 'doubts' | 'groups';

function authorName(user: unknown, fallback: string): string {
  if (user && typeof user === 'object' && 'name' in user) {
    return (user as { name?: string }).name ?? fallback;
  }
  return fallback;
}

export function ForumScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<ForumNav>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tab, setTab] = useState<ForumTab>('doubts');
  const [showAsk, setShowAsk] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState(DEFAULT_FORUM_SUBJECT);
  const [groupName, setGroupName] = useState('');
  const [examTag, setExamTag] = useState(DEFAULT_EXAM_TAG);
  const { isOffline } = useNetworkStatus();

  const tabOptions = useMemo(
    () => [
      { key: 'doubts' as const, label: t('forum.tabDoubts') },
      { key: 'groups' as const, label: t('forum.tabGroups') },
    ],
    [t],
  );

  const doubtsQuery = useDoubts({ limit: 30 });
  const groupsQuery = useGroups({ limit: 30 });
  const createDoubt = useCreateDoubt();
  const voteDoubt = useVoteDoubt();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const submitDoubt = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert(t('forum.missingFields'), t('forum.missingFieldsBody'));
      return;
    }

    await createDoubt.mutateAsync({ title: title.trim(), body: body.trim(), subject: subject.trim() });
    setShowAsk(false);
    setTitle('');
    setBody('');
  };

  const submitGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('forum.nameRequired'), t('forum.nameRequiredBody'));
      return;
    }

    await createGroup.mutateAsync({ name: groupName.trim(), examTag: examTag.trim() });
    setGroupName('');
  };

  const studentLabel = t('forum.student');

  return (
    <FeatureScreenLayout
      title={t('forum.title')}
      subtitle={t('forum.subtitle')}
      rightAction={
        <Button
          label={t('forum.askAi')}
          variant="ghost"
          size="sm"
          onPress={() => navigateToAskAI(navigation)}
        />
      }
    >
      <SegTabs options={tabOptions} value={tab} onChange={setTab} />

      <PremiumFeatureCard style={styles.quickLinks}>
        <Text style={styles.quickLinksTitle}>{t('forum.friendsQuickTitle')}</Text>
        <View style={styles.quickLinksRow}>
          <Pressable style={styles.quickLink} onPress={() => navigation.navigate('Friends')}>
            <UserPlus size={18} color={theme.colors.brand.primary} />
            <Text style={styles.quickLinkLabel}>{t('forum.addFriends')}</Text>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => navigation.navigate('Messages')}>
            <MessageCircle size={18} color={theme.colors.brand.primary} />
            <Text style={styles.quickLinkLabel}>{t('forum.messagesQuick')}</Text>
          </Pressable>
        </View>
      </PremiumFeatureCard>

      {tab === 'doubts' ? (
        <>
          <Button
            label={showAsk ? t('forum.cancel') : t('forum.askDoubt')}
            onPress={() => setShowAsk((v) => !v)}
          />
          {showAsk ? (
            <PremiumFeatureCard style={styles.form}>
              <TextField label={t('forum.titleLabel')} value={title} onChangeText={setTitle} />
              <TextField label={t('forum.subject')} value={subject} onChangeText={setSubject} />
              <TextField
                label={t('forum.describeDoubt')}
                value={body}
                onChangeText={setBody}
                multiline
                style={styles.multiline}
              />
              <Button
                label={createDoubt.isPending ? t('forum.posting') : t('forum.postDoubt')}
                onPress={submitDoubt}
                disabled={createDoubt.isPending}
              />
            </PremiumFeatureCard>
          ) : null}

          <QueryStateView
            isLoading={doubtsQuery.isLoading}
            isError={doubtsQuery.isError}
            isFetching={doubtsQuery.isFetching}
            isOffline={isOffline}
            hasData={(doubtsQuery.data?.items.length ?? 0) > 0}
            onRetry={() => void doubtsQuery.refetch()}
          >
            <View style={styles.list}>
              {(doubtsQuery.data?.items ?? []).map((post) => (
                <PremiumFeatureCard key={post.id} style={styles.post}>
                  <View style={styles.postHeader}>
                    <MessageCircle size={16} color={theme.colors.brand.primary} />
                    <Text style={styles.postSubject}>{post.subject}</Text>
                  </View>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postBody} numberOfLines={3}>{post.body}</Text>
                  <View style={styles.postFooter}>
                    <Text style={styles.postMeta}>{authorName(post.userId, studentLabel)}</Text>
                    <View style={styles.votes}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('forum.tabDoubts')}
                        onPress={() => void voteDoubt.mutateAsync(post.id)}
                        style={styles.voteBtn}
                      >
                        <ThumbsUp size={14} color={theme.colors.text.tertiary} />
                        <Text style={styles.votesText}>{post.votes ?? 0}</Text>
                      </Pressable>
                      <Text style={styles.answers}>
                        {t('forum.answers', { count: post.answers?.length ?? 0 })}
                      </Text>
                    </View>
                  </View>
                </PremiumFeatureCard>
              ))}
            </View>
          </QueryStateView>
        </>
      ) : (
        <>
          <PremiumFeatureCard style={styles.form}>
            <TextField label={t('forum.groupName')} value={groupName} onChangeText={setGroupName} />
            <TextField label={t('forum.examTag')} value={examTag} onChangeText={setExamTag} />
            <Button
              label={createGroup.isPending ? t('forum.creating') : t('forum.createGroup')}
              onPress={submitGroup}
              disabled={createGroup.isPending}
            />
          </PremiumFeatureCard>

          <QueryStateView
            isLoading={groupsQuery.isLoading}
            isError={groupsQuery.isError}
            isFetching={groupsQuery.isFetching}
            isOffline={isOffline}
            hasData={(groupsQuery.data?.items.length ?? 0) > 0}
            onRetry={() => void groupsQuery.refetch()}
          >
            <View style={styles.list}>
              {(groupsQuery.data?.items ?? []).map((group) => {
                const memberIds = group.members ?? [];
                const createdById =
                  typeof group.createdBy === 'object' && group.createdBy && 'id' in group.createdBy
                    ? String((group.createdBy as { id?: string }).id)
                    : typeof group.createdBy === 'string'
                      ? group.createdBy
                      : undefined;
                const isMember =
                  Boolean(user?.id) &&
                  (memberIds.includes(user!.id) || createdById === user!.id);

                return (
                <PremiumFeatureCard key={group.id} style={styles.post}>
                  <View style={styles.postHeader}>
                    <Users size={16} color={theme.colors.brand.primary} />
                    <Text style={styles.postSubject}>{group.examTag}</Text>
                  </View>
                  <Text style={styles.postTitle}>{group.name}</Text>
                  <Text style={styles.postMeta}>
                    {t('forum.membersBy', {
                      count: group.members?.length ?? 1,
                      name: authorName(group.createdBy, studentLabel),
                    })}
                  </Text>
                  {isMember ? (
                    <Button
                      label={t('forum.openChat')}
                      variant="ghost"
                      size="sm"
                      onPress={() =>
                        navigation.navigate('GroupChat', {
                          groupId: group.id,
                          groupName: group.name,
                        })
                      }
                    />
                  ) : (
                    <Button
                      label={joinGroup.isPending ? t('forum.joining') : t('forum.joinGroup')}
                      variant="ghost"
                      size="sm"
                      onPress={() => joinGroup.mutate(group.id)}
                    />
                  )}
                </PremiumFeatureCard>
              );
              })}
            </View>
          </QueryStateView>
        </>
      )}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    quickLinks: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    quickLinksTitle: {
      ...theme.typography.presets.label,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
    },
    quickLinksRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    quickLink: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface.muted,
    },
    quickLinkLabel: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    form: { gap: theme.spacing.md, padding: theme.spacing.md },
    multiline: { minHeight: 100, textAlignVertical: 'top' },
    list: { gap: theme.spacing.md },
    post: { gap: theme.spacing.sm, padding: theme.spacing.md },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    postSubject: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
    postTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    postBody: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    postMeta: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    votes: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    voteBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    votesText: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    answers: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
  });
}
