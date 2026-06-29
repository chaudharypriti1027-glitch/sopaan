import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Radio, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card, Pill, Screen, SectionTitle } from '../../components';
import { LiveClassChatPanel } from '../../components/live/LiveClassChatPanel';
import { LiveClassComingSoon } from '../../components/live/LiveClassComingSoon';
import { LiveClassReactionsBar } from '../../components/live/LiveClassReactionsBar';
import { LiveClassStreamGate } from '../../components/live/LiveClassStreamGate';
import {
  useLiveClass,
  useLiveClassViewerToken,
  useLiveClasses,
} from '../../hooks';
import { useLiveClassChat } from '../../hooks/useSocket';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

export function LiveClassViewerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<{ key: string; name: 'LiveClassViewer'; params: MainStackParamList['LiveClassViewer'] }>();
  const { liveClassId } = route.params;
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const listQuery = useLiveClasses();
  const classQuery = useLiveClass(liveClassId);
  const streamingConfigured = listQuery.data?.streamingConfigured ?? classQuery.data?.streamingConfigured;
  const tokenQuery = useLiveClassViewerToken(streamingConfigured ? liveClassId : undefined);
  const chat = useLiveClassChat(streamingConfigured ? liveClassId : undefined);
  const [attendeeCount, setAttendeeCount] = useState(0);

  useEffect(() => {
    if (classQuery.data?.attendeeCount != null) {
      setAttendeeCount(classQuery.data.attendeeCount);
    }
  }, [classQuery.data?.attendeeCount, classQuery.dataUpdatedAt]);

  useEffect(() => {
    if (tokenQuery.data?.attendeeCount != null) {
      setAttendeeCount(tokenQuery.data.attendeeCount);
    }
  }, [tokenQuery.data?.attendeeCount]);

  const liveClass = classQuery.data;
  const isLoading = classQuery.isLoading || (streamingConfigured && tokenQuery.isLoading);
  const showComingSoon = streamingConfigured === false;

  if (showComingSoon) {
    return (
      <Screen scroll={false} padded={false} style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {liveClass?.title ?? 'Live class'}
          </Text>
        </View>
        <LiveClassComingSoon message={listQuery.data?.message} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false} style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <View style={styles.headerMeta}>
          <Pill label="LIVE" variant="coral" />
          <View style={styles.viewers}>
            <Users size={14} color={theme.colors.text.secondary} />
            <Text style={styles.viewerCount}>{attendeeCount} watching</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {liveClass?.title ?? 'Live class'}
        </Text>
        {liveClass?.instructor ? (
          <Text style={styles.instructor}>{liveClass.instructor}</Text>
        ) : null}
      </View>

      <View style={styles.playerWrap}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.brand.primary} size="large" />
            <Text style={styles.loadingText}>Joining live class…</Text>
          </View>
        ) : tokenQuery.isError ? (
          <View style={styles.centered}>
            <Radio size={28} color={theme.colors.semantic.error} />
            <Text style={styles.errorText}>Unable to join this stream.</Text>
          </View>
        ) : tokenQuery.data?.url && tokenQuery.data.token ? (
          <LiveClassStreamGate
            url={tokenQuery.data.url}
            token={tokenQuery.data.token}
            role={tokenQuery.data.role}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Stream unavailable.</Text>
          </View>
        )}
      </View>

      {tokenQuery.data ? (
        <>
          <LiveClassReactionsBar
            recent={chat.reactions}
            onRaiseHand={() => {
              if (!chat.sendReaction('raise_hand')) {
                Alert.alert('Not connected', 'Reconnecting…');
              }
            }}
            onReaction={(emoji) => {
              if (!chat.sendReaction('emoji', emoji)) {
                Alert.alert('Not connected', 'Reconnecting…');
              }
            }}
          />
          <LiveClassChatPanel
            messages={chat.messages}
            connected={chat.connected}
            currentUserId={chat.currentUserId}
            onSend={chat.sendMessage}
          />
        </>
      ) : null}

      {liveClass?.description ? (
        <Card style={styles.descriptionCard}>
          <SectionTitle title="About this session" />
          <Text style={styles.description}>{liveClass.description}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.surface.default },
    header: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    back: { ...theme.typography.presets.bodyMedium, color: theme.colors.brand.primary },
    headerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    viewers: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    viewerCount: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    title: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
    instructor: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    playerWrap: {
      flex: 1,
      minHeight: 240,
      backgroundColor: '#0b1020',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    loadingText: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    errorText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    descriptionCard: { margin: theme.spacing.lg, gap: theme.spacing.sm },
    description: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
