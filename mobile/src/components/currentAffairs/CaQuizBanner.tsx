import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { CaPremiumIcon } from './CaPremiumIcon';
import { CA_UI, caFeedCard, caPressFeedback } from './caTheme';

type CaQuizBannerProps = {
  onPress: () => void;
};

export function CaQuizBanner({ onPress }: CaQuizBannerProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && caPressFeedback]}
      testID="ca-daily-quiz-banner"
    >
      <LinearGradient
        colors={[CA_UI.goldSoft, '#FFF8E8', CA_UI.goldSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <LinearGradient
          colors={[CA_UI.goldLt, CA_UI.gold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.topRule}
        />
        <View style={styles.row}>
          <CaPremiumIcon Icon={Sparkles} tone="gold" size="md" />
          <View style={styles.copy}>
            <Text style={styles.title}>{t('currentAffairs.dailyQuiz')}</Text>
            <Text style={styles.subtitle}>{t('currentAffairs.dailyQuizSubtitle')}</Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{t('currentAffairs.start')}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      ...caFeedCard({ marginBottom: 14 }),
    },
    fill: {
      borderRadius: CA_UI.cardRadiusLg,
      overflow: 'hidden',
    },
    topRule: {
      height: 3,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    copy: {
      flex: 1,
      gap: 3,
    },
    title: {
      fontSize: 14,
      fontWeight: '800',
      color: CA_UI.text,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 11,
      fontWeight: '600',
      color: CA_UI.muted,
      lineHeight: 15,
    },
    cta: {
      backgroundColor: CA_UI.accent,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    ctaText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}
