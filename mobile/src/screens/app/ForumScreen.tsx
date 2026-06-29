import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageCircle, ThumbsUp, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Screen,
  SectionTitle,
  SegTabs,
  TextField,
} from '../../components';
import {
  useCreateDoubt,
  useCreateGroup,
  useDoubts,
  useGroups,
  useJoinGroup,
} from '../../hooks';
import { useAuth } from '../../auth';
import type { MainStackParamList } from '../../navigation/types';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import { useTheme } from '../../theme';

type ForumNav = NativeStackNavigationProp<MainStackParamList, 'Forum'>;

type ForumTab = 'doubts' | 'groups';

const TAB_OPTIONS = [
  { key: 'doubts' as const, label: 'Doubt Forum' },
  { key: 'groups' as const, label: 'Study Groups' },
];

function authorName(user: unknown): string {
  if (user && typeof user === 'object' && 'name' in user) {
    return (user as { name?: string }).name ?? 'Student';
  }
  return 'Student';
}

export function ForumScreen() {
  const navigation = useNavigation<ForumNav>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tab, setTab] = useState<ForumTab>('doubts');
  const [showAsk, setShowAsk] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('General');
  const [groupName, setGroupName] = useState('');
  const [examTag, setExamTag] = useState('SSC-CGL');

  const doubtsQuery = useDoubts({ limit: 30 });
  const groupsQuery = useGroups({ limit: 30 });
  const createDoubt = useCreateDoubt();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const submitDoubt = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing fields', 'Add a title and description.');
      return;
    }

    await createDoubt.mutateAsync({ title: title.trim(), body: body.trim(), subject: subject.trim() });
    setShowAsk(false);
    setTitle('');
    setBody('');
  };

  const submitGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Name required', 'Enter a group name.');
      return;
    }

    await createGroup.mutateAsync({ name: groupName.trim(), examTag: examTag.trim() });
    setGroupName('');
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <SectionTitle title="Community" subtitle="Doubts and study groups" />
        <Button
          label="Ask AI"
          variant="ghost"
          size="sm"
          onPress={() => navigateToAskAI(navigation)}
        />
      </View>

      <SegTabs options={TAB_OPTIONS} value={tab} onChange={setTab} />

      {tab === 'doubts' ? (
        <>
          <Button
            label={showAsk ? 'Cancel' : 'Ask a doubt'}
            onPress={() => setShowAsk((v) => !v)}
          />
          {showAsk ? (
            <Card style={styles.form}>
              <TextField label="Title" value={title} onChangeText={setTitle} />
              <TextField label="Subject" value={subject} onChangeText={setSubject} />
              <TextField
                label="Describe your doubt"
                value={body}
                onChangeText={setBody}
                multiline
                style={styles.multiline}
              />
              <Button
                label={createDoubt.isPending ? 'Posting…' : 'Post doubt'}
                onPress={submitDoubt}
                disabled={createDoubt.isPending}
              />
            </Card>
          ) : null}

          {doubtsQuery.isLoading ? (
            <ActivityIndicator color={theme.colors.brand.primary} />
          ) : (
            <View style={styles.list}>
              {(doubtsQuery.data?.items ?? []).map((post) => (
                <Card key={post.id} style={styles.post}>
                  <View style={styles.postHeader}>
                    <MessageCircle size={16} color={theme.colors.brand.primary} />
                    <Text style={styles.postSubject}>{post.subject}</Text>
                  </View>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postBody} numberOfLines={3}>{post.body}</Text>
                  <View style={styles.postFooter}>
                    <Text style={styles.postMeta}>{authorName(post.userId)}</Text>
                    <View style={styles.votes}>
                      <ThumbsUp size={14} color={theme.colors.text.tertiary} />
                      <Text style={styles.votesText}>{post.votes ?? 0}</Text>
                      <Text style={styles.answers}>{post.answers?.length ?? 0} answers</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <Card style={styles.form}>
            <TextField label="Group name" value={groupName} onChangeText={setGroupName} />
            <TextField label="Exam tag" value={examTag} onChangeText={setExamTag} />
            <Button
              label={createGroup.isPending ? 'Creating…' : 'Create group'}
              onPress={submitGroup}
              disabled={createGroup.isPending}
            />
          </Card>

          {groupsQuery.isLoading ? (
            <ActivityIndicator color={theme.colors.brand.primary} />
          ) : (
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
                <Card key={group.id} style={styles.post}>
                  <View style={styles.postHeader}>
                    <Users size={16} color={theme.colors.brand.primary} />
                    <Text style={styles.postSubject}>{group.examTag}</Text>
                  </View>
                  <Text style={styles.postTitle}>{group.name}</Text>
                  <Text style={styles.postMeta}>
                    {group.members?.length ?? 1} members · by {authorName(group.createdBy)}
                  </Text>
                  {isMember ? (
                    <Button
                      label="Open group chat"
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
                      label={joinGroup.isPending ? 'Joining…' : 'Join group'}
                      variant="ghost"
                      size="sm"
                      onPress={() => joinGroup.mutate(group.id)}
                    />
                  )}
                </Card>
              );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    form: { gap: theme.spacing.md },
    multiline: { minHeight: 100, textAlignVertical: 'top' },
    list: { gap: theme.spacing.md },
    post: { gap: theme.spacing.sm },
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
    votes: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    votesText: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    answers: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
  });
}
