import { Radio } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ensureLiveKitReady, isLiveKitNativeAvailable } from '../../livekit/bootstrap';
import { useTheme } from '../../theme';
import { isDevStreamingUrl } from '../../utils/streaming';
import { LiveClassDevStage } from './LiveClassDevStage';
import { LiveClassStreamWebView } from './LiveClassStreamWebView';
import type { LiveClassStreamProps } from './LiveClassStream';

type DevStreamProps = {
  classId: string;
  title?: string;
  instructor?: string;
};

export type LiveClassStreamGateProps = LiveClassStreamProps & {
  classId?: string;
};

export function LiveClassStreamGate(props: LiveClassStreamGateProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [Stream, setStream] = useState<ComponentType<LiveClassStreamProps> | null>(null);
  const [DevStream, setDevStream] = useState<ComponentType<DevStreamProps> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const devMode = isDevStreamingUrl(props.url);
  const playbackAvailable = isLiveKitNativeAvailable();

  useEffect(() => {
    if (!devMode || !playbackAvailable || !props.classId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const mod =
          Platform.OS === 'web'
            ? await import('./LiveClassDevStream.web')
            : await import('./LiveClassDevStream');

        if (!cancelled) {
          setDevStream(() => mod.LiveClassDevStream);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('joinFailed'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [devMode, playbackAvailable, props.classId, t]);

  useEffect(() => {
    if (devMode || !playbackAvailable) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (Platform.OS !== 'web') {
          await ensureLiveKitReady();
        }

        const mod =
          Platform.OS === 'web'
            ? await import('./LiveClassStream.web')
            : await import('./LiveClassStream');

        if (!cancelled) {
          setStream(() => mod.LiveClassStream);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('joinFailed'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [devMode, playbackAvailable, t]);

  if (devMode) {
    if (!playbackAvailable || !props.classId) {
      return (
        <LiveClassDevStage
          title={props.title}
          instructor={props.instructorName}
          role={props.role === 'host' ? 'host' : 'viewer'}
        />
      );
    }

    if (loadError) {
      return (
        <View style={styles.centered}>
          <Radio size={28} color={theme.colors.semantic.error} />
          <Text style={styles.body}>{loadError}</Text>
        </View>
      );
    }

    if (!DevStream) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand.primary} size="large" />
          <Text style={styles.body}>{t('joining')}</Text>
        </View>
      );
    }

    return (
      <DevStream
        classId={props.classId}
        title={props.title}
        instructor={props.instructorName}
      />
    );
  }

  if (!playbackAvailable) {
    if (Platform.OS !== 'web' && props.url && props.token && !devMode) {
      return (
        <LiveClassStreamWebView
          url={props.url}
          token={props.token}
          instructorName={props.instructorName}
          topic={props.topic}
          title={props.title}
        />
      );
    }

    return (
      <View style={styles.centered}>
        <Radio size={28} color={theme.colors.semantic.warning} />
        <Text style={styles.title}>{t('nativeUnavailableTitle')}</Text>
        <Text style={styles.body}>{t('nativeUnavailableBody')}</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Radio size={28} color={theme.colors.semantic.error} />
        <Text style={styles.body}>{loadError}</Text>
      </View>
    );
  }

  if (!Stream) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.brand.primary} size="large" />
        <Text style={styles.body}>{t('joining')}</Text>
      </View>
    );
  }

  return <Stream {...props} />;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    body: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}
