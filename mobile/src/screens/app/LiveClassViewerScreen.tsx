import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlayCircle, Radio, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BackButton, Card, Pill, Screen, SectionTitle } from '../../components';
import { LiveClassChatPanel } from '../../components/live/LiveClassChatPanel';
import { LiveClassComingSoon } from '../../components/live/LiveClassComingSoon';
import { LiveClassFloatingReactions } from '../../components/live/LiveClassFloatingReactions';
import {
  LiveClassRecordingLoading,
  LiveClassRecordingPlayer,
} from '../../components/live/LiveClassRecordingPlayer';
import { LiveClassReactionsBar } from '../../components/live/LiveClassReactionsBar';
import { LiveClassScheduledPanel } from '../../components/live/LiveClassScheduledPanel';
import { LiveClassStreamGate } from '../../components/live/LiveClassStreamGate';
import { isDevStreamingUrl } from '../../utils/streaming';
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
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const styles = useMemo(() => createStyles(theme), [theme]);

  const listQuery = useLiveClasses();
  const classQuery = useLiveClass(liveClassId);
  const liveClass = classQuery.data;
  const status = liveClass?.status ?? 'scheduled';
  const streamingConfigured =
    listQuery.data?.streamingConfigured ?? liveClass?.streamingConfigured ?? true;
  const isLive = status === 'live';
  const hasRecording =
    status === 'ended' &&
    Boolean(liveClass?.recordingUrl) &&
    liveClass?.recordingStatus === 'ready';

  const tokenQuery = useLiveClassViewerToken(streamingConfigured && isLive ? liveClassId : undefined);
  const chat = useLiveClassChat(streamingConfigured && isLive ? liveClassId : undefined);
  const viewerCount =
    chat.presenceCount > 0 ? chat.presenceCount : liveClass?.attendeeCount ?? liveClass?.viewers ?? 0;

  const isLoadingMeta = classQuery.isLoading;
  const isJoiningLive = isLive && streamingConfigured && tokenQuery.isLoading;
  const showComingSoon = streamingConfigured === false;

  if (showComingSoon) {
    return (
      <Screen scroll={false} padded={false} style={styles.screen}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title} numberOfLines={2}>
            {liveClass?.title ?? t('defaultTitle')}
          </Text>
        </View>
        <LiveClassComingSoon message={listQuery.data?.message} />
      </Screen>
    );
  }

  if (isLoadingMeta) {
    return (
      <Screen scroll={false} padded={false} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand.primary} size="large" />
          <Text style={styles.loadingText}>{t('loadingClass')}</Text>
        </View>
      </Screen>
    );
  }

  if (status === 'scheduled' && liveClass) {
    return (
      <Screen scroll={false} padded={false} style={styles.screen}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title} numberOfLines={2}>
            {liveClass.title}
          </Text>
          {liveClass.instructor ? (
            <Text style={styles.instructor}>{liveClass.instructor}</Text>
          ) : null}
        </View>
        <LiveClassScheduledPanel liveClass={liveClass} />
      </Screen>
    );
  }

  if (hasRecording && liveClass?.recordingUrl) {
    return (
      <Screen scroll={false} padded={false} style={styles.screen}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerMeta}>
            <Pill label={t('recorded')} variant="primary" />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {liveClass.title}
          </Text>
          {liveClass.instructor ? (
            <Text style={styles.instructor}>{liveClass.instructor}</Text>
          ) : null}
        </View>
        <View style={styles.playerWrap}>
          <LiveClassRecordingPlayer recordingUrl={liveClass.recordingUrl} title={liveClass.title} />
        </View>
        {liveClass.description ? (
          <Card style={styles.descriptionCard}>
            <SectionTitle title={t('aboutSession')} />
            <Text style={styles.description}>{liveClass.description}</Text>
          </Card>
        ) : null}
      </Screen>
    );
  }

  if (status === 'ended') {
    return (
      <Screen scroll={false} padded={false} style={styles.screen}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title} numberOfLines={2}>
            {liveClass?.title ?? t('defaultTitle')}
          </Text>
        </View>
        <View style={styles.centered}>
          <PlayCircle size={32} color={theme.colors.text.secondary} />
          <Text style={styles.errorText}>{t('recordingPending')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false} style={styles.screen}>
      <View style={styles.liveHeader}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerMeta}>
          <Pill label={t('live')} variant="coral" />
          <View style={styles.viewers}>
            <Users size={14} color={theme.colors.text.secondary} />
            <Text style={styles.viewerCount}>{t('watching', { count: viewerCount })}</Text>
          </View>
        </View>
      </View>

      <View style={styles.playerWrap}>
        {isJoiningLive ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.brand.primary} size="large" />
            <Text style={styles.loadingText}>{t('joining')}</Text>
          </View>
        ) : tokenQuery.isError ? (
          <View style={styles.centered}>
            <Radio size={28} color={theme.colors.semantic.error} />
            <Text style={styles.errorText}>{t('joinFailed')}</Text>
          </View>
        ) : tokenQuery.data && (tokenQuery.data.provider === 'dev' || isDevStreamingUrl(tokenQuery.data.url)) ? (
          <LiveClassStreamGate
            classId={liveClassId}
            url={tokenQuery.data.url ?? 'dev://local-live'}
            token={tokenQuery.data.token ?? ''}
            role={tokenQuery.data.role === 'host' ? 'host' : 'viewer'}
            muteAllSignal={chat.muteAllSignal}
            instructorName={liveClass?.instructor}
            topic={liveClass?.topic}
            title={liveClass?.title}
          />
        ) : tokenQuery.data?.url && tokenQuery.data.token ? (
          <>
            <LiveClassStreamGate
              classId={liveClassId}
              url={tokenQuery.data.url}
              token={tokenQuery.data.token}
              role={tokenQuery.data.role === 'host' ? 'host' : 'viewer'}
              muteAllSignal={chat.muteAllSignal}
              instructorName={liveClass?.instructor}
              topic={liveClass?.topic}
              title={liveClass?.title}
            />
            <LiveClassFloatingReactions reactions={chat.reactions} />
          </>
        ) : tokenQuery.data?.token === null ? (
          <LiveClassRecordingLoading />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{t('streamUnavailable')}</Text>
          </View>
        )}
      </View>

      {tokenQuery.data?.token ? (
        <>
          {chat.hostAnnouncement ? (
            <View style={styles.announcement}>
              <Text style={styles.announcementText}>{chat.hostAnnouncement}</Text>
            </View>
          ) : null}
          <LiveClassReactionsBar
            handRaised={chat.handRaised}
            onRaiseHand={() => {
              if (!chat.raiseHand()) {
                Alert.alert(t('notConnected'), t('reconnecting'));
              }
            }}
            onLowerHand={() => {
              if (!chat.lowerHand()) {
                Alert.alert(t('notConnected'), t('reconnecting'));
              }
            }}
            onReaction={(emoji) => {
              if (!chat.sendReaction(emoji)) {
                Alert.alert(t('notConnected'), t('reconnecting'));
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
          <SectionTitle title={t('aboutSession')} />
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
      backgroundColor: theme.colors.surface.default,
    },
    liveHeader: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xs,
      backgroundColor: theme.colors.surface.default,
    },
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
      minHeight: 280,
      backgroundColor: '#0b1020',
      position: 'relative',
    },
    announcement: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.brand.primaryMuted,
    },
    announcementText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      textAlign: 'center',
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
