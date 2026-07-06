import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';
import { RESULT_UI } from './resultTheme';

type ResultCoachPanelProps = {
  feedback: string;
  weakTopics: string[];
  actions: string[];
  onPracticePress: () => void;
};

export function ResultCoachPanel({
  feedback,
  weakTopics,
  actions,
  onPracticePress,
}: ResultCoachPanelProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Sparkles size={21} color={RESULT_UI.goldDeep} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{t('result.yourFeedback')}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>✦ AI</Text>
        </View>
      </View>

      <Text style={styles.feedback}>{feedback}</Text>

      {weakTopics.length > 0 ? (
        <Text style={styles.weakTopics}>{weakTopics.join(' · ')}</Text>
      ) : null}

      {actions.map((action) => (
        <View key={action} style={styles.actionRow}>
          <Check size={16} color={RESULT_UI.goldDeep} strokeWidth={2.2} />
          <Text style={styles.actionText}>{action}</Text>
        </View>
      ))}

      <Button
        label={t('result.practiceWeakTopics')}
        variant="gold"
        size="sm"
        fullWidth
        onPress={onPracticePress}
        style={styles.cta}
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      borderRadius: RESULT_UI.cardRadius,
      padding: 16,
      backgroundColor: RESULT_UI.goldSoft,
      borderWidth: 1,
      borderColor: RESULT_UI.goldBorder,
      ...platformShadow({ color: RESULT_UI.gold, offsetY: 10, opacity: 0.12, radius: 16, elevation: 2 }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      marginBottom: 11,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...platformShadow({ color: RESULT_UI.gold, offsetY: 6, opacity: 0.25, radius: 10, elevation: 2 }),
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: RESULT_UI.ink,
    },
    tag: {
      borderRadius: 99,
      paddingHorizontal: 9,
      paddingVertical: 3,
      backgroundColor: RESULT_UI.goldLt,
    },
    tagText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#2a2110',
    },
    feedback: {
      fontSize: 12.5,
      fontWeight: '600',
      color: '#8a6a2f',
      lineHeight: 19,
    },
    weakTopics: {
      fontSize: 12,
      fontWeight: '700',
      color: RESULT_UI.red,
      marginTop: 8,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      marginTop: 9,
    },
    actionText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '600',
      color: RESULT_UI.ink2,
      lineHeight: 18,
    },
    cta: {
      marginTop: 14,
    },
  });
}
