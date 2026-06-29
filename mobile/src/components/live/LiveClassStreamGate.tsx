import { Radio } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ensureLiveKitReady, isLiveKitNativeAvailable } from '../../livekit/bootstrap';
import { useTheme } from '../../theme';
import type { LiveClassStreamProps } from './LiveClassStream';

export function LiveClassStreamGate(props: LiveClassStreamProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [Stream, setStream] = useState<ComponentType<LiveClassStreamProps> | null>(null);
  const [nativeUnavailable, setNativeUnavailable] = useState(!isLiveKitNativeAvailable());

  useEffect(() => {
    if (nativeUnavailable) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await ensureLiveKitReady();
        const mod = await import('./LiveClassStream');
        if (!cancelled) {
          setStream(() => mod.LiveClassStream);
        }
      } catch {
        if (!cancelled) {
          setNativeUnavailable(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nativeUnavailable]);

  if (nativeUnavailable) {
    return (
      <View style={styles.centered}>
        <Radio size={28} color={theme.colors.semantic.warning} />
        <Text style={styles.title}>{t('nativeUnavailableTitle')}</Text>
        <Text style={styles.body}>{t('nativeUnavailableBody')}</Text>
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
