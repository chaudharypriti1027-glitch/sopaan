import { Sparkles, Video } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

type LiveClassComingSoonProps = {
  message?: string | null;
};

export function LiveClassComingSoon({ message }: LiveClassComingSoonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClasses' });
  const { t: tViewer } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LinearGradient
      colors={[LIVE.stageMid, LIVE.navy, LIVE.stageDeep]}
      locations={[0, 0.45, 1]}
      style={styles.wrap}
    >
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.card}>
        <View style={styles.iconStack}>
          <View style={styles.iconWellOuter}>
            <Video size={22} color={LIVE.goldLt} strokeWidth={1.85} />
          </View>
          <View style={styles.iconWell}>
            <Sparkles size={24} color={LIVE.goldLt} strokeWidth={1.9} />
          </View>
        </View>
        <Text style={styles.eyebrow}>{tViewer('comingSoonEyebrow')}</Text>
        <Text style={styles.title}>{t('comingSoon')}</Text>
        <Text style={styles.body}>{message ?? tViewer('comingSoonBodyExtended')}</Text>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    glow: {
      position: 'absolute',
      top: '20%',
      alignSelf: 'center',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: 'rgba(201,162,75,0.18)',
    },
    card: {
      alignItems: 'center',
      gap: 10,
      maxWidth: 340,
      width: '100%',
      paddingHorizontal: 28,
      paddingVertical: 32,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(233,207,141,0.22)',
    },
    iconStack: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    iconWellOuter: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: LIVE.glassBorder,
      marginRight: -10,
      zIndex: 1,
    },
    iconWell: {
      width: 58,
      height: 58,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(201,162,75,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(233,207,141,0.32)',
      zIndex: 2,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: LIVE.goldLt,
      textAlign: 'center',
    },
    title: {
      fontSize: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: theme.typography.fonts.ui.regular,
      color: LIVE.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
  });
}
