import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lightbulb, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import type { AffairAiSummary } from '../../api/currentAffairs';
import { CA_UI, caFeedCard } from './caTheme';
import { PREMIUM } from '../premium/premiumStyles';

type CaAiSummaryCardProps = {
  summary?: AffairAiSummary;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function CaAiSummaryCard({
  summary,
  isLoading,
  isError,
  onRetry,
}: CaAiSummaryCardProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  if (isLoading) {
    return (
      <View style={styles.card} testID="ca-ai-summary-loading">
        <LinearGradient
          colors={[PREMIUM.heroGradient[0], PREMIUM.heroGradient[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBand}
        >
          <Sparkles size={16} color="#E3C97F" />
          <Text style={styles.heroTitle}>{t('currentAffairs.aiSummaryTitle')}</Text>
        </LinearGradient>
        <View style={styles.loadingBody}>
          <ActivityIndicator color={CA_UI.accent} />
          <Text style={styles.loadingText}>{t('currentAffairs.aiSummaryLoading')}</Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.card} testID="ca-ai-summary-error">
        <Text style={styles.errorText}>{t('currentAffairs.aiSummaryError')}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('currentAffairs.aiSummaryRetry')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!summary?.summary && !summary?.shortAnswer) {
    return null;
  }

  return (
    <View style={styles.card} testID="ca-ai-summary-card">
      <LinearGradient
        colors={[PREMIUM.heroGradient[0], PREMIUM.heroGradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBand}
      >
        <Sparkles size={16} color="#E3C97F" />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{t('currentAffairs.aiSummaryTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('currentAffairs.aiSummarySubtitle')}</Text>
        </View>
      </LinearGradient>

      {summary.summary ? <Text style={styles.summary}>{summary.summary}</Text> : null}

      {summary.shortAnswer ? (
        <View style={styles.inlineBlock}>
          <Text style={styles.inlineLabel}>{t('currentAffairs.shortAnswer')}</Text>
          <Text style={styles.inlineBody}>{summary.shortAnswer}</Text>
        </View>
      ) : null}

      {summary.examTip ? (
        <View style={styles.tipRow}>
          <Lightbulb size={14} color={CA_UI.gold} />
          <View style={styles.tipCopy}>
            <Text style={styles.inlineLabel}>{t('currentAffairs.examTip')}</Text>
            <Text style={styles.inlineBody}>{summary.examTip}</Text>
          </View>
        </View>
      ) : null}

      {summary.keyPoints?.length ? (
        <View style={styles.points}>
          <Text style={styles.inlineLabel}>{t('currentAffairs.keyPoints')}</Text>
          {summary.keyPoints.map((point) => (
            <Text key={point} style={styles.bullet}>
              • {point}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      ...caFeedCard({ padding: 0 }),
      overflow: 'hidden',
    },
    heroBand: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    heroCopy: {
      flex: 1,
      gap: 2,
    },
    heroTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.3,
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    heroSubtitle: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.76)',
    },
    loadingBody: {
      alignItems: 'center',
      gap: 10,
      paddingVertical: 22,
      paddingHorizontal: 16,
    },
    loadingText: {
      fontSize: 13,
      fontWeight: '600',
      color: CA_UI.muted,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#C4634F',
      textAlign: 'center',
      padding: 16,
    },
    retryBtn: {
      alignSelf: 'center',
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    retryText: {
      fontSize: 13,
      fontWeight: '700',
      color: CA_UI.accent,
    },
    summary: {
      fontSize: 15,
      lineHeight: 24,
      fontWeight: '600',
      color: CA_UI.text,
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    inlineBlock: {
      gap: 4,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    inlineLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: CA_UI.accent,
    },
    inlineBody: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '600',
      color: CA_UI.text2,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    tipCopy: {
      flex: 1,
      gap: 4,
    },
    points: {
      gap: 6,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    bullet: {
      fontSize: 14,
      lineHeight: 21,
      color: CA_UI.text2,
    },
  });
}
