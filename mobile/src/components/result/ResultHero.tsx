import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RankRing } from '../RankRing';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { ResultConfetti } from './ResultConfetti';
import { RESULT_UI } from './resultTheme';

type ResultHeroProps = {
  accuracy: number;
  testTitle: string;
  correct: number;
  total: number;
  durationLabel: string;
  onBack: () => void;
  onShare: () => void;
};

function performanceBadgeKey(accuracy: number): string {
  if (accuracy >= 80) return 'result.badgeGreat';
  if (accuracy >= 60) return 'result.badgeGood';
  if (accuracy >= 40) return 'result.badgeKeepGoing';
  return 'result.badgeNiceTry';
}

export function ResultHero({
  accuracy,
  testTitle,
  correct,
  total,
  durationLabel,
  onBack,
  onShare,
}: ResultHeroProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  return (
    <LinearGradient
      colors={[...RESULT_UI.heroGradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.blob} />
      <ResultConfetti />

      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
          onPress={onBack}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('result.headerTitle')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('result.share')}
          onPress={onShare}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.badge}>
        <Star size={13} color="#2a2110" fill="#2a2110" strokeWidth={1.5} />
        <Text style={styles.badgeText}>{t(performanceBadgeKey(accuracy))}</Text>
      </View>

      <View style={styles.ringWrap}>
        <RankRing
          value={accuracy}
          max={100}
          label={t('result.accuracy')}
          displayValue={`${accuracy}%`}
          size={180}
          strokeWidth={12}
          trackColor="rgba(255,255,255,0.12)"
          accentColor={RESULT_UI.goldLt}
          labelColor="rgba(255,255,255,0.6)"
        />
      </View>

      <Text style={styles.testTitle} numberOfLines={2}>
        {testTitle}
      </Text>
      <Text style={styles.subtitle}>
        {t('result.heroSubtitle', { correct, total, time: durationLabel })}
      </Text>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    hero: {
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 70,
      alignItems: 'center',
      overflow: 'hidden',
      borderBottomLeftRadius: RESULT_UI.heroRadius,
      borderBottomRightRadius: RESULT_UI.heroRadius,
    },
    blob: {
      position: 'absolute',
      top: -70,
      right: -50,
      width: 220,
      height: 220,
      borderRadius: 999,
      backgroundColor: 'rgba(194,154,78,0.22)',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      zIndex: 3,
      marginBottom: 4,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.88 },
    headerTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      zIndex: 3,
      backgroundColor: RESULT_UI.goldLt,
      borderRadius: 99,
      paddingHorizontal: 13,
      paddingVertical: 6,
    },
    badgeText: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#2a2110',
    },
    ringWrap: {
      marginTop: 10,
      marginBottom: 6,
      zIndex: 3,
    },
    testTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.3,
      textAlign: 'center',
      zIndex: 3,
      paddingHorizontal: 8,
    },
    subtitle: {
      fontSize: 12.5,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.68)',
      marginTop: 3,
      textAlign: 'center',
      zIndex: 3,
    },
  });
}
