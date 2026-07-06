import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { PROFILE, profileCard } from './profileTheme';
import { getLevelTitle, getXpProgress } from './profileUtils';

type ProfileXpCardProps = {
  level: number;
  xp: number;
  replayKey?: number;
};

export function ProfileXpCard({ level, xp, replayKey = 0 }: ProfileXpCardProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const progress = useMemo(() => getXpProgress(xp, level), [xp, level]);
  const title = getLevelTitle(level);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#D8B368', '#C29A4E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bolt}
      >
        <Zap size={23} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
      </LinearGradient>
      <View style={styles.mid}>
        <View style={styles.row}>
          <Text style={styles.title}>
            {t('profile.levelXpTitle', { level, title })}
          </Text>
          <NumText style={styles.meta}>
            {progress.current} / {progress.max} {t('profile.xp')}
          </NumText>
        </View>
        <AnimatedProgressBar
          progress={progress.pct}
          replayKey={replayKey}
          colors={['#D8B368', '#C29A4E']}
          shimmer
          style={styles.track}
        />
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      ...profileCard(theme),
    },
    bolt: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: PROFILE.gold,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 4,
    },
    mid: { flex: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.ink,
    },
    meta: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: PROFILE.muted,
    },
    track: { marginTop: 9 },
  });
}
