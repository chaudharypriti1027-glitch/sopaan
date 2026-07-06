import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme';
import type { LiveClassStreamProps } from './LiveClassStream';
import { buildLiveKitWebViewHtml } from './liveKitWebViewHtml';
import { LiveClassEducatorPlaceholder } from './LiveClassEducatorPlaceholder';
import { useReportLiveVideo } from './liveClassStageContext';

type LiveClassStreamWebViewProps = Pick<
  LiveClassStreamProps,
  'url' | 'token' | 'instructorName' | 'topic' | 'title'
>;

export function LiveClassStreamWebView({
  url,
  token,
  instructorName,
  topic,
  title,
  immersive = false,
}: LiveClassStreamWebViewProps & { immersive?: boolean }) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [hasVideo, setHasVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html = useMemo(() => buildLiveKitWebViewHtml(url, token), [url, token]);
  useReportLiveVideo(hasVideo);

  return (
    <View style={styles.stage}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        onMessage={(event) => {
          const message = event.nativeEvent.data;
          if (message === 'video') {
            setHasVideo(true);
            setError(null);
          } else if (message === 'connected') {
            setError(null);
          } else if (message.startsWith('error:')) {
            setError(message.slice(6));
          }
        }}
      />

      {!hasVideo ? (
        <View style={styles.waitingOverlay} pointerEvents="none">
          {immersive ? (
            <LiveClassEducatorPlaceholder
              name={instructorName ?? title ?? t('defaultTitle')}
              subtitle={topic ?? undefined}
              hint={error ?? t('joining')}
              loading={!error}
            />
          ) : (
            <View style={styles.waiting}>
              {error ? null : <ActivityIndicator color={theme.colors.brand.primary} />}
              <Text style={styles.waitingText}>{error ?? t('joining')}</Text>
            </View>
          )}
        </View>
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
          {instructorName ? (
            <Text style={styles.overlayInstructor} numberOfLines={1}>
              {instructorName}
            </Text>
          ) : null}
          {topic ? (
            <Text style={styles.overlayTopic} numberOfLines={2}>
              {topic}
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
    webview: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
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
    overlayTopic: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.75)',
    },
  });
}
