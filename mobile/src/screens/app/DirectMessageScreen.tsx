import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FileText, Image as ImageIcon, Paperclip, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BackButton, Button, OptimizedImage, Screen, SectionTitle, TextField } from '../../components';
import { uploadDocument, uploadImage } from '../../api/media';
import { useDirectChat } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { pickChatDocument, pickChatImage } from '../../utils/chatAttachments';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = {
  key: string;
  name: 'DirectMessage';
  params: MainStackParamList['DirectMessage'];
};

export function DirectMessageScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { conversationId, friendName } = route.params;
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { messages, error, sendMessage, currentUserId, connected } = useDirectChat(conversationId);
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);

  const submitText = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    if (!sendMessage({ text, messageType: 'text' })) {
      Alert.alert(t('messages.notConnected'));
      return;
    }

    setDraft('');
  };

  const sendAttachment = async (kind: 'image' | 'document') => {
    try {
      setUploading(true);
      const picked = kind === 'image' ? await pickChatImage() : await pickChatDocument();

      if (!picked) {
        return;
      }

      if (picked.kind === 'image') {
        const uploaded = await uploadImage(
          { uri: picked.uri, name: picked.name, type: picked.type },
          'chat',
        );

        const ok = sendMessage({
          text: draft.trim(),
          messageType: 'image',
          attachmentUrl: uploaded.url,
          attachmentName: picked.name,
          attachmentMimeType: picked.type,
        });

        if (!ok) {
          Alert.alert(t('messages.notConnected'));
          return;
        }
      } else {
        const uploaded = await uploadDocument(
          { uri: picked.uri, name: picked.name, type: picked.type },
          'chat',
        );

        const ok = sendMessage({
          text: draft.trim(),
          messageType: 'document',
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name,
          attachmentMimeType: uploaded.mimeType,
        });

        if (!ok) {
          Alert.alert(t('messages.notConnected'));
          return;
        }
      }

      setDraft('');
    } catch {
      Alert.alert(t('messages.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen style={styles.screen} padded={false}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <SectionTitle title={friendName} subtitle={connected ? t('messages.connected') : t('messages.reconnecting')} />
      </View>

      {error ? <Text style={styles.error}>{error.message}</Text> : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => {
          const mine = item.senderId === currentUserId;

          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
              {!mine ? <Text style={styles.author}>{item.senderName}</Text> : null}

              {item.messageType === 'image' && item.attachmentUrl ? (
                <OptimizedImage uri={item.attachmentUrl} style={styles.image} />
              ) : null}

              {item.messageType === 'document' && item.attachmentUrl ? (
                <Pressable
                  style={styles.document}
                  onPress={() => void Linking.openURL(item.attachmentUrl)}
                >
                  <FileText size={18} color={theme.colors.brand.primary} />
                  <Text style={styles.documentName} numberOfLines={2}>
                    {item.attachmentName || t('messages.document')}
                  </Text>
                </Pressable>
              ) : null}

              {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <View style={styles.attachRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void sendAttachment('image')}
            disabled={uploading || !connected}
            style={styles.attachBtn}
          >
            <ImageIcon size={20} color={theme.colors.brand.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void sendAttachment('document')}
            disabled={uploading || !connected}
            style={styles.attachBtn}
          >
            <Paperclip size={20} color={theme.colors.brand.primary} />
          </Pressable>
          {uploading ? <ActivityIndicator size="small" color={theme.colors.brand.primary} /> : null}
        </View>
        <TextField
          placeholder={t('messages.placeholder')}
          value={draft}
          onChangeText={setDraft}
          multiline
          style={styles.input}
        />
        <Button
          label={t('messages.send')}
          icon={<Send size={16} color={theme.colors.brand.onPrimary} />}
          onPress={submitText}
          disabled={!connected || !draft.trim() || uploading}
        />
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
    error: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
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
    author: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    messageText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
    },
    image: {
      width: 220,
      height: 160,
      borderRadius: theme.radii.md,
    },
    document: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface.default,
    },
    documentName: {
      ...theme.typography.presets.caption,
      color: theme.colors.brand.primary,
      flex: 1,
    },
    composer: {
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.subtle,
      backgroundColor: theme.colors.surface.default,
    },
    attachRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    attachBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface.muted,
    },
    input: {
      minHeight: 44,
      maxHeight: 120,
      textAlignVertical: 'top',
    },
  });
}
