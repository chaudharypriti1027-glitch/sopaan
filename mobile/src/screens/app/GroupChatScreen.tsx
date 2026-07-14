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
import { useTranslation } from 'react-i18next';
import { BackButton, Button, FeatureScreenLayout, TextField } from '../../components';
import { useGroupChat } from '../../hooks/useSocket';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

export function GroupChatScreen() {
  const { t } = useTranslation('app');
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
      Alert.alert(t('groupChat.notConnected'), t('groupChat.notConnectedBody'));
      return;
    }
    setDraft('');
  };

  const confirmReport = (messageId: string) => {
    Alert.alert(t('groupChat.reportTitle'), t('groupChat.reportBody'), [
      { text: t('groupChat.cancel'), style: 'cancel' },
      {
        text: t('groupChat.report'),
        style: 'destructive',
        onPress: () => reportMessage(messageId),
      },
    ]);
  };

  return (
    <FeatureScreenLayout
      title={groupName}
      subtitle={connected ? t('groupChat.connected') : t('groupChat.reconnecting')}
      contentStyle={styles.layout}
    >
      <BackButton onPress={() => navigation.goBack()} />

      {error && error.code !== 'REPORTED' ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : null}
      {error?.code === 'REPORTED' ? (
        <Text style={styles.success}>{error.message}</Text>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => {
          const mine = item.userId === currentUserId;

          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
              <View style={styles.bubbleHeader}>
                <Text style={styles.author}>{mine ? t('groupChat.you') : item.userName}</Text>
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
          placeholder={t('groupChat.placeholder')}
          value={draft}
          onChangeText={setDraft}
          multiline
          style={styles.input}
        />
        <Button
          label={t('groupChat.send')}
          onPress={submit}
          disabled={!connected || !draft.trim()}
        />
      </View>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    layout: {
      flex: 1,
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    error: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
    },
    success: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.success,
    },
    list: {
      flex: 1,
    },
    messages: {
      gap: theme.spacing.sm,
      flexGrow: 1,
      paddingVertical: theme.spacing.sm,
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
      gap: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.subtle,
      paddingTop: theme.spacing.sm,
      backgroundColor: theme.colors.surface.default,
    },
    input: { minHeight: 44, maxHeight: 120, textAlignVertical: 'top' },
  });
}
