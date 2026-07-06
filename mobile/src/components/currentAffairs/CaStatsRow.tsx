import { Clock, Flame, Newspaper } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { CaPremiumIcon } from './CaPremiumIcon';
import { CA_UI, caChip } from './caTheme';
import type { PremiumIconTone } from '../premium/premiumIconTokens';

type CaStatsRowProps = {
  total: number;
  today: number;
  trending: number;
};

export function CaStatsRow({ total, today, trending }: CaStatsRowProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  const stats: {
    Icon: typeof Newspaper;
    value: number;
    label: string;
    tone: PremiumIconTone;
  }[] = [
    { Icon: Newspaper, value: total, label: t('currentAffairs.statArticles'), tone: 'lavender' },
    { Icon: Clock, value: today, label: t('currentAffairs.statToday'), tone: 'mint' },
    { Icon: Flame, value: trending, label: t('currentAffairs.statTrending'), tone: 'gold' },
  ];

  return (
    <View style={styles.row}>
      {stats.map(({ Icon, value, label, tone }) => (
        <View key={label} style={styles.stat}>
          <CaPremiumIcon Icon={Icon} tone={tone} size="sm" />
          <View style={styles.copy}>
            <NumText style={styles.value}>{value}</NumText>
            <Text style={styles.label}>{label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      backgroundColor: CA_UI.bg,
    },
    stat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      ...caChip({ paddingVertical: 10, paddingHorizontal: 10 }),
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    value: {
      fontSize: 15,
      fontWeight: '800',
      color: CA_UI.text,
      lineHeight: 16,
    },
    label: {
      fontSize: 9,
      color: CA_UI.muted,
      marginTop: 2,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
}
