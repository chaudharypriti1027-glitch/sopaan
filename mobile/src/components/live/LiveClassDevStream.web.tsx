import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createDevStreamPeerConnection, useDevStreamViewer } from '../../hooks/useDevStreamViewer';
import { useTheme } from '../../theme';
import { LiveClassEducatorPlaceholder } from './LiveClassEducatorPlaceholder';

type LiveClassDevStreamProps = {
  classId: string;
  title?: string;
  instructor?: string;
  instructorSubtitle?: string;
  immersive?: boolean;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasMedia, setHasMedia] = useState(false);

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    const element = videoRef.current;
    if (element) {
      element.srcObject = stream;
      void element.play().catch(() => undefined);
      setHasMedia(true);
    }
  }, []);

  const { error, isConnecting, isFailed, retry } = useDevStreamViewer(
    classId,
    createDevStreamPeerConnection,
    handleRemoteStream,
  );

  return (
    <View style={styles.stage}>
      { }
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#0b1020',
        }}
      />

      {!hasMedia ? (
        immersive ? (
          <LiveClassEducatorPlaceholder
            name={instructor ?? title ?? t('defaultTitle')}
            subtitle={instructorSubtitle}
            hint={error ?? (isConnecting ? t('connectingEducator') : t('waitingEducator'))}
            loading={isConnecting}
          />
        ) : (
          <View style={styles.waiting}>
            {isConnecting ? <ActivityIndicator color={theme.colors.brand.primary} /> : null}
            <Text style={styles.waitingText}>
              {error ?? (isConnecting ? t('connectingEducator') : t('waitingEducator'))}
            </Text>
            {isFailed ? (
              <Pressable onPress={retry} style={styles.retryButton}>
                <Text style={styles.retryText}>{t('retryStream')}</Text>
              </Pressable>
            ) : null}
          </View>
        )
      ) : null}

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
        </LinearGradient>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    stage: {
      flex: 1,
      backgroundColor: '#0b1020',
      position: 'relative',
    },
    waiting: {
      ...StyleSheet.absoluteFillObject,
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
  });
}
