import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowRight, Calendar, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { HeroIcon3D } from './HomePremiumIcon';
import { HOME_UI, homePressFeedback } from './homeTheme';
import type { HomeFeed } from '../../types/home';
import { isReservedExamSentinel } from '../../utils/examTarget';

type HomeExamCountdownBannerProps = {
  countdown?: HomeFeed['countdown'];
  onPress?: () => void;
};

function isGenericExamName(name?: string | null) {
  return isReservedExamSentinel(name);
}

export function HomeExamCountdownBanner({ countdown, onPress }: HomeExamCountdownBannerProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  const showSetup = !countdown || (isGenericExamName(countdown.examName) && countdown.daysLeft <= 0);

  if (showSetup) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.examSetupA11y')}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.banner, styles.setupBanner, pressed && onPress && styles.pressed]}
        testID="home-section-countdown"
      >
        <HeroIcon3D Icon={Target} tone="gold" size="md" />
        <View style={styles.copy}>
          <Text style={styles.setupTitle}>{t('home.examSetupTitle')}</Text>
          <Text style={styles.setupSub}>{t('home.examSetupSub')}</Text>
        </View>
        {onPress ? <ArrowRight size={18} color={HOME_UI.goldLt} strokeWidth={2.2} /> : null}
      </Pressable>
    );
  }

  const examLabel = isGenericExamName(countdown.examName)
    ? t('home.targetExam')
    : countdown.examName;
  const isExamDay = countdown.daysLeft <= 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.examCountdownA11y', {
        days: countdown.daysLeft,
        exam: examLabel,
      })}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.banner, pressed && onPress && styles.pressed]}
      testID="home-section-countdown"
    >
      <View style={styles.daysCol}>
        {isExamDay ? (
          <Text style={styles.examDayBadge}>{t('home.examDayBadge')}</Text>
        ) : (
          <>
            <NumText style={styles.daysNum}>{countdown.daysLeft}</NumText>
            <Text style={styles.daysUnit}>{t('home.daysUnit')}</Text>
          </>
        )}
      </View>

      <View style={styles.copy}>
        <Text style={styles.headline} numberOfLines={2}>
          {isExamDay
            ? t('home.examDayTitle', { exam: examLabel })
            : t('home.daysToNamedExam', { exam: examLabel })}
        </Text>
        {countdown.dateLabel ? (
          <View style={styles.dateRow}>
            <Calendar size={12} color="rgba(255,255,255,0.55)" strokeWidth={2} />
            <Text style={styles.dateLabel}>{countdown.dateLabel}</Text>
          </View>
        ) : null}
      </View>

      {onPress ? (
        <View style={styles.chevronWrap}>
          <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      zIndex: 2,
    },
    setupBanner: {
      backgroundColor: 'rgba(194,154,78,0.16)',
      borderColor: 'rgba(227,201,127,0.35)',
    },
    daysCol: {
      minWidth: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    daysNum: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 30,
      letterSpacing: -0.5,
    },
    daysUnit: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.62)',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    examDayBadge: {
      fontSize: 11,
      fontWeight: '800',
      color: HOME_UI.goldLt,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    copy: {
      flex: 1,
      gap: 5,
    },
    headline: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.1,
      lineHeight: 18,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dateLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.58)',
    },
    setupTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    setupSub: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.62)',
      lineHeight: 15,
    },
    chevronWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    pressed: homePressFeedback,
  });
}
