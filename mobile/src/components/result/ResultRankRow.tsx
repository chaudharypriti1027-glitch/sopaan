import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart3, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { useFormat } from '../../i18n/useFormat';
import { platformShadow } from '../../utils/platformShadow';
import { RESULT_UI } from './resultTheme';

type ResultRankRowProps = {
  rank?: number | null;
  percentile?: number | null;
};

export function ResultRankRow({ rank, percentile }: ResultRankRowProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const { formatOrdinal } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <View style={[styles.icon, styles.iconGold]}>
          <Trophy size={19} color={RESULT_UI.goldDeep} strokeWidth={2} />
        </View>
        <View>
          <NumText style={styles.value}>{rank != null ? `#${rank}` : '—'}</NumText>
          <Text style={styles.label}>{t('result.testRank')}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={[styles.icon, styles.iconSage]}>
          <BarChart3 size={19} color={RESULT_UI.sageDeep} strokeWidth={2} />
        </View>
        <View>
          <NumText style={styles.value}>
            {percentile != null ? formatOrdinal(percentile) : '—'}
          </NumText>
          <Text style={styles.label}>{t('result.percentileLabel')}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    card: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: RESULT_UI.surface,
      borderWidth: 1,
      borderColor: RESULT_UI.line,
      borderRadius: 16,
      padding: 14,
      ...platformShadow({ color: RESULT_UI.navy, offsetY: 10, opacity: 0.08, radius: 16, elevation: 2 }),
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    iconGold: {
      backgroundColor: RESULT_UI.goldSoft,
    },
    iconSage: {
      backgroundColor: RESULT_UI.sageSoft,
    },
    value: {
      fontSize: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: RESULT_UI.ink,
    },
    label: {
      fontSize: 10.5,
      color: RESULT_UI.muted,
      fontWeight: '600',
      marginTop: 1,
    },
  });
}
