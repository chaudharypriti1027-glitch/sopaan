import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlayCircle, Radio } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../api/errors';
import { BackButton, Card, Pill, Screen, SectionTitle } from '../../components';
import { usePremiumDialog } from '../../components/premium/PremiumDialogProvider';
import { LiveClassComingSoon } from '../../components/live/LiveClassComingSoon';
import { LiveClassImmersiveShell } from '../../components/live/LiveClassImmersiveShell';
import {
  LiveClassRecordingLoading,
  LiveClassRecordingPlayer,
} from '../../components/live/LiveClassRecordingPlayer';
import { LiveClassScheduledPanel } from '../../components/live/LiveClassScheduledPanel';
import { LiveClassStreamGate } from '../../components/live/LiveClassStreamGate';
import { LIVE } from '../../components/live/liveTheme';
import { isDevStreamingUrl } from '../../utils/streaming';
import {
  useLiveClass,
  useLiveClassViewerToken,
  useLiveClasses,
} from '../../hooks';
import { useLiveClassOrientation } from '../../hooks/useLiveClassOrientation';
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
  const { confirm } = usePremiumDialog();

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
  const showComingSoon = streamingConfigured === false && !hasRecording;

  useLiveClassOrientation(isLive && !showComingSoon);

  const instructorSubtitle = liveClass
    ? [liveClass.examTag, liveClass.topic].filter(Boolean).join(' · ')
    : undefined;

  const handleLeave = () => {
    confirm({
      title: t('leave'),
      message: t('leaveConfirm'),
      confirmLabel: t('leave'),
      icon: 'logout',
      tone: 'danger',
      onConfirm: () => navigation.goBack(),
    });
  };

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
      <SafeAreaView style={styles.liveRoot} edges={['left', 'right', 'bottom']}>
        <View style={styles.scheduledHeader}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.scheduledHeaderText}>
            <Text style={styles.scheduledTitle} numberOfLines={2}>
              {liveClass.title}
            </Text>
            {liveClass.instructor ? (
              <Text style={styles.scheduledInstructor}>{liveClass.instructor}</Text>
            ) : null}
          </View>
        </View>
        <LiveClassScheduledPanel liveClass={liveClass} />
      </SafeAreaView>
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

  const streamProps = {
    classId: liveClassId,
    url: tokenQuery.data?.url ?? '',
    token: tokenQuery.data?.token ?? '',
    role: (tokenQuery.data?.role === 'host' ? 'host' : 'viewer') as 'host' | 'viewer',
    muteAllSignal: chat.muteAllSignal,
    instructorName: liveClass?.instructor,
    instructorSubtitle,
    topic: liveClass?.topic,
    title: liveClass?.title,
    immersive: true,
  };

  const renderStream = () => {
    if (isJoiningLive) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand.primary} size="large" />
          <Text style={styles.loadingTextDark}>{t('joining')}</Text>
        </View>
      );
    }

    if (tokenQuery.isError) {
      const needsSignIn =
        tokenQuery.error instanceof ApiError && tokenQuery.error.status === 401;
      return (
        <View style={styles.centered}>
          <Radio size={28} color={theme.colors.semantic.error} />
          <Text style={styles.loadingTextDark}>
            {needsSignIn ? t('signInRequired') : t('joinFailed')}
          </Text>
        </View>
      );
    }

    if (
      tokenQuery.data &&
      (tokenQuery.data.provider === 'dev' || isDevStreamingUrl(tokenQuery.data.url))
    ) {
      return (
        <LiveClassStreamGate
          {...streamProps}
          url={tokenQuery.data.url ?? 'dev://local-live'}
          token={tokenQuery.data.token ?? ''}
          instructorSubtitle={instructorSubtitle}
        />
      );
    }

    if (tokenQuery.data?.url && tokenQuery.data.token) {
      return <LiveClassStreamGate {...streamProps} instructorSubtitle={instructorSubtitle} />;
    }

    if (tokenQuery.data?.token === null) {
      return <LiveClassRecordingLoading />;
    }

    return (
      <View style={styles.centered}>
        <Text style={styles.loadingTextDark}>{t('streamUnavailable')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.liveRoot}>
      <LiveClassImmersiveShell
        title={liveClass?.title ?? t('defaultTitle')}
        instructor={liveClass?.instructor}
        instructorSubtitle={instructorSubtitle}
        topic={liveClass?.topic}
        startedAt={liveClass?.startedAt}
        viewerCount={viewerCount}
        pinnedMessage={chat.hostAnnouncement}
        pinnedAuthor={liveClass?.instructor}
        messages={chat.messages}
        reactions={chat.reactions}
        currentUserId={chat.currentUserId}
        hostUserId={
          chat.hostUserId ?? liveClass?.educatorId ?? liveClass?.instructorId ?? undefined
        }
        handRaised={chat.handRaised}
        connected={chat.connected}
        onBack={() => navigation.goBack()}
        onLeave={handleLeave}
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
        onSend={chat.sendMessage}
      >
        {renderStream()}
      </LiveClassImmersiveShell>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.surface.default },
    liveRoot: { flex: 1, backgroundColor: '#12162B' },
    scheduledHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
      backgroundColor: LIVE.navyDeep,
    },
    scheduledHeaderText: { flex: 1, gap: 2, paddingTop: 4 },
    scheduledTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    scheduledInstructor: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
    },
    header: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface.default,
    },
    headerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    loadingText: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    loadingTextDark: { ...theme.typography.presets.body, color: 'rgba(255,255,255,0.75)' },
    errorText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    descriptionCard: { margin: theme.spacing.lg, gap: theme.spacing.sm },
    description: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
