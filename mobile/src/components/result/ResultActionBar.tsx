import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Eye, RotateCcw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';
import { RESULT_UI } from './resultTheme';

type ResultActionBarProps = {
  onReview: () => void;
  onRetake: () => void;
  onMoreTests: () => void;
  onMockAnalysis?: () => void;
};

export function ResultActionBar({
  onReview,
  onRetake,
  onMoreTests,
  onMockAnalysis,
}: ResultActionBarProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        onPress={onReview}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <LinearGradient
          colors={[RESULT_UI.navy2, '#1F2648']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.primaryBtn}
        >
          <Eye size={18} color={RESULT_UI.goldLt} strokeWidth={2} />
          <Text style={styles.primaryText}>{t('result.reviewSolutions')}</Text>
        </LinearGradient>
      </Pressable>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={onRetake}
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
        >
          <RotateCcw size={18} color={RESULT_UI.ink2} strokeWidth={2} />
          <Text style={styles.ghostText}>{t('result.retake')}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onMoreTests}
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
        >
          <ArrowRight size={18} color={RESULT_UI.ink2} strokeWidth={2} />
          <Text style={styles.ghostText}>{t('result.moreTests')}</Text>
        </Pressable>
      </View>

      {onMockAnalysis ? (
        <Pressable
          accessibilityRole="button"
          onPress={onMockAnalysis}
          style={({ pressed }) => [styles.analysisBtn, pressed && styles.pressed]}
        >
          <Text style={styles.analysisText}>{t('result.mockAnalysis')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      marginTop: 20,
      gap: 11,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      paddingVertical: 16,
      borderRadius: 16,
      ...platformShadow({ color: RESULT_UI.navy, offsetY: 16, opacity: 0.35, radius: 20, elevation: 4 }),
    },
    primaryText: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    row: {
      flexDirection: 'row',
      gap: 11,
    },
    ghostBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: RESULT_UI.surface,
      borderWidth: 1,
      borderColor: RESULT_UI.line,
    },
    ghostText: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: RESULT_UI.ink2,
    },
    analysisBtn: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    analysisText: {
      fontSize: 13,
      fontWeight: '700',
      color: RESULT_UI.navy,
    },
    pressed: { opacity: 0.9 },
  });
}
