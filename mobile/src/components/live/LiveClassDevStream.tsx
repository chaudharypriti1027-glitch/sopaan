import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDevStreamViewer, type PeerFactory } from '../../hooks/useDevStreamViewer';
import { ensureLiveKitReady, isLiveKitNativeAvailable } from '../../livekit/bootstrap';
import { useTheme } from '../../theme';
import { DEV_STREAM_ICE_SERVERS } from '../../utils/webrtcIce';
import { LiveClassEducatorPlaceholder } from './LiveClassEducatorPlaceholder';
import { useReportLiveVideo } from './liveClassStageContext';

type LiveClassDevStreamProps = {
  classId: string;
  title?: string;
  instructor?: string;
  instructorSubtitle?: string;
  immersive?: boolean;
};

type NativeWebRtcModule = {
  RTCView: ComponentType<Record<string, unknown>>;
  RTCPeerConnection: new (config: RTCConfiguration) => RTCPeerConnection;
};

export function LiveClassDevStream({
  classId,
  title,
  instructor,
  instructorSubtitle,
  immersive = false,
}: LiveClassDevStreamProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [webrtc, setWebrtc] = useState<NativeWebRtcModule | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [remoteStreamUrl, setRemoteStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLiveKitNativeAvailable()) {
      setBootError(t('nativeUnavailableTitle'));
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await ensureLiveKitReady();
        const mod = await import('@livekit/react-native-webrtc');
        if (!cancelled) {
          setWebrtc({
            RTCView: mod.RTCView,
            RTCPeerConnection: mod.RTCPeerConnection as unknown as NativeWebRtcModule['RTCPeerConnection'],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setBootError(err instanceof Error ? err.message : t('joinFailed'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const createPeer = useCallback<PeerFactory>(() => {
    const PeerConnection = webrtc?.RTCPeerConnection;
    if (!PeerConnection) {
      throw new Error('WebRTC is not ready');
    }

    return new PeerConnection({ iceServers: DEV_STREAM_ICE_SERVERS }) as unknown as ReturnType<PeerFactory>;
  }, [webrtc]);

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    const toUrl = (stream as MediaStream & { toURL?: () => string }).toURL;
    setRemoteStreamUrl(toUrl?.() ?? null);
  }, []);

  const { error, isConnecting, isConnected, isFailed, retry } = useDevStreamViewer(
    webrtc ? classId : '',
    createPeer,
    handleRemoteStream,
  );

  const displayError = bootError ?? error;
  const showSpinner = !bootError && !webrtc && isLiveKitNativeAvailable();
  const hasVideo = Boolean(remoteStreamUrl && webrtc);
  useReportLiveVideo(hasVideo);

  return (
    <View style={styles.stage}>
      {hasVideo && webrtc ? (
        <webrtc.RTCView
          streamURL={remoteStreamUrl!}
          style={styles.video}
          objectFit="cover"
          mirror={false}
        />
      ) : immersive ? (
        <View style={styles.waitingOverlay} pointerEvents="none">
          <LiveClassEducatorPlaceholder
            name={instructor ?? title ?? t('defaultTitle')}
            subtitle={instructorSubtitle}
            hint={displayError ?? (showSpinner || isConnecting ? t('connectingEducator') : t('waitingEducator'))}
            loading={showSpinner || isConnecting}
          />
        </View>
      ) : (
        <View style={styles.waiting}>
          {showSpinner || isConnecting ? (
            <ActivityIndicator color={theme.colors.brand.primary} />
          ) : null}
          <Text style={styles.waitingText}>
            {displayError ?? (showSpinner || isConnecting ? t('connectingEducator') : t('waitingEducator'))}
          </Text>
          {isFailed && webrtc ? (
            <Pressable onPress={retry} style={styles.retryButton}>
              <Text style={styles.retryText}>{t('retryStream')}</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {!immersive ? (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.overlay}
          pointerEvents="none"
        >
          {title ? (
            <Text style={styles.overlayTitle} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          {instructor ? (
            <Text style={styles.overlayInstructor} numberOfLines={1}>
              {instructor}
            </Text>
          ) : null}
          {Platform.OS !== 'web' && isConnected ? (
            <Text style={styles.overlayHint} numberOfLines={2}>
              {t('devStreamHint')}
            </Text>
          ) : null}
        </LinearGradient>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    stage: {
      flex: 1,
      backgroundColor: '#000000',
      overflow: 'hidden',
    },
    video: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
    },
    waitingOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
      backgroundColor: 'rgba(11,16,32,0.55)',
    },
    waiting: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    waitingText: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.full,
      backgroundColor: theme.colors.brand.primary,
    },
    retryText: {
      ...theme.typography.presets.bodyMedium,
      color: '#fff',
    },
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      paddingTop: theme.spacing['3xl'],
      gap: theme.spacing.xs,
    },
    overlayTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: '#fff',
    },
    overlayInstructor: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.92)',
    },
    overlayHint: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.55)',
    },
  });
}
