import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { NumText } from '../NumText';
import { useTheme } from '../../theme';
import type { LiveChatMessage } from '../../realtime/events';
import { LIVE } from './liveTheme';
import { liveAvatarTone, liveInitials } from './liveUtils';

const AVATAR_GRADIENTS = {
  gold: ['#D8B368', '#B9822F'] as const,
  navy: ['#3A4680', '#232A4D'] as const,
  sage: ['#6C9A8A', '#4C7264'] as const,
};

type LiveClassOverlayCommentsProps = {
  messages: LiveChatMessage[];
  currentUserId?: string;
  hostUserId?: string;
  hostName?: string;
};

export function LiveClassOverlayComments({
  messages,
  currentUserId,
  hostUserId,
  hostName,
}: LiveClassOverlayCommentsProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scrollRef = useRef<ScrollView>(null);
  const visible = messages.slice(-6);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['transparent', 'rgba(10,12,25,0.35)']}
        style={styles.fade}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {visible.map((message) => {
          const mine = message.userId === currentUserId;
          const isHost =
            Boolean(message.isHost) ||
            Boolean(hostUserId && message.userId === hostUserId) ||
            message.userId === 'hand-ack';
          const tone = liveAvatarTone(message.userName);
          const label = mine ? t('you') : message.userName;

          return (
            <View key={message.id} style={styles.row}>
              <LinearGradient
                colors={AVATAR_GRADIENTS[tone]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <NumText style={styles.avatarText}>{liveInitials(message.userName)}</NumText>
              </LinearGradient>
              <Text style={styles.body}>
                <Text style={[styles.author, isHost && styles.authorHost]}>
                  {isHost ? `${hostName ?? label} (${t('host')})` : label}
                </Text>
                <Text style={styles.text}> {message.text}</Text>
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      maxHeight: 140,
      position: 'relative',
    },
    fade: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 28,
      zIndex: 1,
    },
    list: {
      maxHeight: 140,
    },
    listContent: {
      gap: 9,
      paddingBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    avatar: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 9.5,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    body: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
    },
    author: {
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: LIVE.goldLt,
    },
    authorHost: {
      color: LIVE.sageLt,
    },
    text: {
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.92)',
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
  });
}
