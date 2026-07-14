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
          <Text style={styles.pick}>
            {yourAnswerLabel}: {selectedKey}
            {correctKey
              ? ` · ${correctAnswerLabel ?? correctLabel}: ${correctKey}`
              : ''}
          </Text>
        ) : null}
      </View>
      <Text style={styles.label}>{solutionLabel}</Text>
      <AiAnswerBody text={explanation} formulaLabel={formulaLabel} />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      marginTop: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    statusRow: {
      gap: 4,
    },
    statusPill: {
      alignSelf: 'flex-start',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
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
      fontSize: 12,
      color: RESULT_UI.ink2,
      fontWeight: '600',
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: RESULT_UI.muted,
    },
  });
}
