import { Clock, Flame, Newspaper } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { CA_UI } from './caTheme';

type CaStatsRowProps = {
  total: number;
  today: number;
  trending: number;
};

export function CaStatsRow({ total, today, trending }: CaStatsRowProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  const stats = [
    { Icon: Newspaper, value: total, label: t('currentAffairs.statArticles') },
    { Icon: Clock, value: today, label: t('currentAffairs.statToday') },
    { Icon: Flame, value: trending, label: t('currentAffairs.statTrending') },
  ];

  return (
    <View style={styles.row}>
      {stats.map(({ Icon, value, label }) => (
        <View key={label} style={styles.stat}>
          <View style={styles.icon}>
            <Icon size={12} color={CA_UI.accent} strokeWidth={2.5} />
          </View>
          <View>
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
      paddingBottom: 4,
      backgroundColor: CA_UI.surface,
    },
    stat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: CA_UI.bg,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    icon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: CA_UI.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    value: {
      fontSize: 13,
      fontWeight: '800',
      color: CA_UI.text2,
      lineHeight: 14,
    },
    label: {
      fontSize: 9,
      color: CA_UI.faint,
      marginTop: 2,
      fontWeight: '600',
    },
  });
}
