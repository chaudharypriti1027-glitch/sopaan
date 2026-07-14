import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageCircle } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeatureScreenLayout, PremiumListRow, QueryStateView } from '../../components';
import { useConversations, useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

function previewLabel(
  type: 'text' | 'image' | 'document',
  text: string,
  t: (key: string) => string,
) {
  if (type === 'image') return t('messages.photo');
  if (type === 'document') return text || t('messages.document');
  return text;
}

export function MessagesScreen() {
  const { t } = useTranslation('app');
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const conversationsQuery = useConversations({ limit: 50 });
  const { isOffline } = useNetworkStatus();

  return (
    <FeatureScreenLayout title={t('messages.title')} subtitle={t('messages.subtitle')}>
      <QueryStateView
        isLoading={conversationsQuery.isLoading}
        isError={conversationsQuery.isError}
        isFetching={conversationsQuery.isFetching}
        isOffline={isOffline}
        hasData={Boolean(conversationsQuery.data?.items.length)}
        onRetry={() => void conversationsQuery.refetch()}
      >
        {conversationsQuery.data?.items.length ? (
          <View style={styles.list}>
            {conversationsQuery.data.items.map((conversation, index, items) => {
              const friend = conversation.friend;
              if (!friend) {
                return null;
              }

              return (
                <PremiumListRow
                  key={conversation.id}
                  title={friend.name}
                  subtitle={previewLabel(
                    conversation.lastMessageType,
                    conversation.lastMessageText,
                    t,
                  )}
                  icon={MessageCircle}
                  tone="indigo"
                  last={index === items.length - 1}
                  onPress={() =>
                    navigation.navigate('DirectMessage', {
                      conversationId: conversation.id,
                      friendUserId: friend.id,
                      friendName: friend.name,
                    })
                  }
                />
              );
            })}
          </View>
        ) : (
          <Text style={styles.empty}>{t('messages.empty')}</Text>
        )}
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    list: {
      borderRadius: theme.radii.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface.default,
    },
    empty: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
    },
  });
}
