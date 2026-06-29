import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Flag } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Screen, SectionTitle, TextField } from '../../components';
import { useGroupChat } from '../../hooks/useSocket';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

export function GroupChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<{ key: string; name: 'GroupChat'; params: MainStackParamList['GroupChat'] }>();
  const { groupId, groupName } = route.params;
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { messages, error, sendMessage, reportMessage, currentUserId, connected } =
    useGroupChat(groupId);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    if (!sendMessage(text)) {
      Alert.alert('Not connected', 'Reconnecting… Please try again in a moment.');
      return;
    }
    setDraft('');
  };

  const confirmReport = (messageId: string) => {
    Alert.alert('Report message?', 'Our moderators will review this message.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => reportMessage(messageId),
      },
    ]);
  };

  return (
    <Screen style={styles.screen} padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <SectionTitle title={groupName} subtitle={connected ? 'Connected' : 'Reconnecting…'} />
      </View>

      {error && error.code !== 'REPORTED' ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : null}
      {error?.code === 'REPORTED' ? (
        <Text style={styles.success}>{error.message}</Text>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => {
          const mine = item.userId === currentUserId;

          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
              <View style={styles.bubbleHeader}>
                <Text style={styles.author}>{mine ? 'You' : item.userName}</Text>
                {!mine ? (
                  <Pressable onPress={() => confirmReport(item.id)} hitSlop={8}>
                    <Flag size={14} color={theme.colors.text.tertiary} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextField
          placeholder="Message your study group…"
          value={draft}
          onChangeText={setDraft}
          multiline
          style={styles.input}
        />
        <Button label="Send" onPress={submit} disabled={!connected || !draft.trim()} />
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: { flex: 1 },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    back: { ...theme.typography.presets.bodyMedium, color: theme.colors.brand.primary },
    error: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
      paddingHorizontal: theme.spacing.lg,
    },
    success: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.success,
      paddingHorizontal: theme.spacing.lg,
    },
    messages: {
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      flexGrow: 1,
    },
    bubble: {
      maxWidth: '85%',
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    bubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.brand.primaryMuted,
    },
    bubbleOther: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface.muted,
    },
    bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm },
    author: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    messageText: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    composer: {
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.subtle,
      backgroundColor: theme.colors.surface.default,
    },
    input: { minHeight: 44, maxHeight: 120, textAlignVertical: 'top' },
  });
}
