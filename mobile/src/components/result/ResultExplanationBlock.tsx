import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AiAnswerBody } from '../ai/AiAnswerBody';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { RESULT_UI } from './resultTheme';

type ResultExplanationBlockProps = {
  explanation: string;
  correctKey?: string;
  selectedKey?: string | null;
  wasCorrect: boolean;
  solutionLabel: string;
  yourAnswerLabel: string;
  correctLabel: string;
  wrongLabel: string;
  correctAnswerLabel?: string;
  formulaLabel: string;
  answerLabel?: string;
  explanationLabel?: string;
  tipLabel?: string;
};

export function ResultExplanationBlock({
  explanation,
  correctKey,
  selectedKey,
  wasCorrect,
  solutionLabel,
  yourAnswerLabel,
  correctLabel,
  wrongLabel,
  correctAnswerLabel,
  formulaLabel,
  answerLabel,
  explanationLabel,
  tipLabel,
}: ResultExplanationBlockProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!explanation.trim()) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusPill, wasCorrect ? styles.statusOk : styles.statusBad]}>
          {wasCorrect ? correctLabel : wrongLabel}
        </Text>
        {selectedKey ? (
          <Text style={styles.pick} numberOfLines={1}>
            {yourAnswerLabel} {selectedKey}
            {correctKey && !wasCorrect
              ? ` · ${correctAnswerLabel ?? correctLabel} ${correctKey}`
              : ''}
          </Text>
        ) : null}
      </View>
      <Text style={styles.label}>{solutionLabel}</Text>
      <AiAnswerBody
        text={explanation}
        formulaLabel={formulaLabel}
        answerLabel={answerLabel}
        explanationLabel={explanationLabel}
        tipLabel={tipLabel}
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      marginTop: theme.spacing.sm,
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: 16,
      backgroundColor: '#FFFCF7',
      borderWidth: 1,
      borderColor: RESULT_UI.line,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    statusPill: {
      alignSelf: 'flex-start',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: 'hidden',
    },
    statusOk: {
      color: RESULT_UI.sageDeep,
      backgroundColor: RESULT_UI.sageSoft,
    },
    statusBad: {
      color: RESULT_UI.red,
      backgroundColor: RESULT_UI.redSoft,
    },
    pick: {
      flex: 1,
      fontSize: 12,
      color: RESULT_UI.ink2,
      fontWeight: '600',
    },
    label: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: RESULT_UI.muted,
    },
  });
}
