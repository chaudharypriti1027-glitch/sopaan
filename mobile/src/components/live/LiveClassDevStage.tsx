import { Radio } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pill } from '../Pill';
import { useTheme } from '../../theme';

type LiveClassDevStageProps = {
  title?: string;
  instructor?: string;
  role: 'host' | 'viewer';
};

/** Placeholder stage when the API uses the local dev streaming provider (no LiveKit). */
export function LiveClassDevStage({ title, instructor, role }: LiveClassDevStageProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LinearGradient
      colors={['#313B6E', '#232A4D', '#161B34']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.stage}
    >
      <View style={styles.inner}>
        <Pill label="LIVE" variant="coral" />
        <Radio size={40} color="#E3C97F" strokeWidth={1.8} />
        <Text style={styles.title} numberOfLines={2}>
          {title ?? 'Live class'}
        </Text>
        {instructor ? <Text style={styles.instructor}>{instructor}</Text> : null}
        <Text style={styles.hint}>
          {role === 'host'
            ? 'Dev mode — add LIVEKIT_API_SECRET in server/.env, then rebuild the app (npm run android).'
            : 'Video requires LiveKit. Ask your educator to set LIVEKIT_API_SECRET in server/.env and use a dev build (not Expo Go).'}
        </Text>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    stage: {
      flex: 1,
      minHeight: 240,
    },
    inner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.xl,
    },
    title: {
      ...theme.typography.presets.h3,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    instructor: {
      ...theme.typography.presets.body,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
    },
    hint: {
      ...theme.typography.presets.caption,
      color: 'rgba(255,255,255,0.55)',
      textAlign: 'center',
      maxWidth: 280,
    },
  });
}
