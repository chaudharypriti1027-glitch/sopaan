import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { TextField } from '../TextField';
import type { GroupChatMessage } from '../../realtime/events';
import { useTheme } from '../../theme';

type LiveClassChatPanelProps = {
  messages: GroupChatMessage[];
  connected: boolean;
  currentUserId?: string;
  onSend: (text: string) => boolean;
};

export function LiveClassChatPanel({
  messages,
  connected,
  currentUserId,
  onSend,
}: LiveClassChatPanelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(true);

  const submit = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    if (onSend(text)) {
      setDraft('');
    }
  };

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={styles.collapsed}>
        <Text style={styles.collapsedLabel}>Show class chat ({messages.length})</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Class chat</Text>
        <Text style={styles.status}>{connected ? 'Live' : 'Reconnecting…'}</Text>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={styles.hide}>Hide</Text>
        </Pressable>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const mine = item.userId === currentUserId;

          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={styles.author}>{mine ? 'You' : item.userName}</Text>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder="Say something…"
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <Pressable accessibilityRole="button" onPress={submit} style={styles.sendBtn}>
          <Text style={styles.sendLabel}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      maxHeight: 220,
      backgroundColor: theme.colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    title: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    status: { ...theme.typography.presets.caption, color: theme.colors.semantic.success },
    hide: { ...theme.typography.presets.caption, color: theme.colors.brand.primary },
    list: { flexGrow: 0 },
    listContent: {
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    bubble: {
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      maxWidth: '92%',
    },
    bubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.brand.primaryMuted,
    },
    bubbleOther: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface.muted,
    },
    author: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      marginBottom: 2,
    },
    text: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    sendBtn: {
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.md,
    },
    sendLabel: {
      ...theme.typography.presets.caption,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.brand.primary,
    },
    collapsed: {
      padding: theme.spacing.md,
      alignItems: 'center',
      backgroundColor: theme.colors.surface.default,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    collapsedLabel: {
      ...theme.typography.presets.caption,
      color: theme.colors.brand.primary,
    },
  });
}
