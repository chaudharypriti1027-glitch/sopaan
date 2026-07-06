import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';
import { RESULT_UI } from './resultTheme';

type ResultRewardRowProps = {
  xp: number;
  coins: number;
};

export function ResultRewardRow({ xp, coins }: ResultRewardRowProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={[RESULT_UI.navy2, RESULT_UI.navyDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.icon}>
          <Zap size={20} color="#FFFFFF" strokeWidth={2} />
        </View>
        <View>
          <NumText style={styles.value}>+{xp}</NumText>
          <Text style={styles.label}>{t('result.xpEarnedLabel')}</Text>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={[RESULT_UI.gold, RESULT_UI.goldDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.icon}>
          <Coins size={20} color="#FFFFFF" strokeWidth={2} />
        </View>
        <View>
          <NumText style={styles.value}>+{coins}</NumText>
          <Text style={styles.label}>{t('result.coinsEarned')}</Text>
        </View>
      </LinearGradient>
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
      borderRadius: 18,
      padding: 15,
      ...platformShadow({ color: RESULT_UI.navy, offsetY: 10, opacity: 0.25, radius: 18, elevation: 3 }),
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    value: {
      fontSize: 19,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 22,
    },
    label: {
      fontSize: 10.5,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
    },
  });
}
