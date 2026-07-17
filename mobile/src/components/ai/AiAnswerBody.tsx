import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';
import { parseAiAnswer } from '../../utils/parseAiAnswer';

type AiAnswerBodyProps = {
  text: string;
  formulaLabel: string;
  answerLabel?: string;
  explanationLabel?: string;
  tipLabel?: string;
};

export function AiAnswerBody({
  text,
  formulaLabel,
  answerLabel = 'Answer',
  explanationLabel = 'Why',
  tipLabel = 'Tip',
}: AiAnswerBodyProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const blocks = useMemo(() => parseAiAnswer(text), [text]);

  return (
    <View style={styles.wrap}>
      {blocks.map((block, index) => {
        if (block.type === 'answer') {
          return (
            <View key={`a-${index}`} style={styles.answerCard}>
              <View style={styles.answerRail} />
              <View style={styles.answerInner}>
                <Text style={styles.answerLabel}>{answerLabel}</Text>
                <Text style={styles.answerText}>{block.text}</Text>
              </View>
            </View>
          );
        }

        if (block.type === 'explanation') {
          return (
            <View key={`e-${index}`} style={styles.section}>
              <Text style={styles.sectionLabel}>{explanationLabel}</Text>
              {block.bullets?.length ? (
                <View style={styles.bulletList}>
                  {block.bullets.map((item, itemIndex) => (
                    <View key={`${index}-${itemIndex}`} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bodyText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.bodyText}>{block.text}</Text>
              )}
            </View>
          );
        }

        if (block.type === 'tip') {
          return (
            <View key={`t-${index}`} style={styles.tipCard}>
              <Lightbulb size={14} color={AI_UI.goldDeep} strokeWidth={2.2} />
              <View style={styles.tipCopy}>
                <Text style={styles.tipLabel}>{tipLabel}</Text>
                <Text style={styles.tipText}>{block.text}</Text>
              </View>
            </View>
          );
        }

        if (block.type === 'heading') {
          return (
            <Text key={`h-${index}`} style={styles.sectionLabel}>
              {block.text}
            </Text>
          );
        }

        if (block.type === 'formula') {
          return (
            <View key={`f-${index}`} style={styles.formula}>
              <Text style={styles.formulaLabel}>{formulaLabel}</Text>
              <Text style={styles.formulaText}>{block.text}</Text>
            </View>
          );
        }

        if (block.type === 'bullet') {
          return (
            <View key={`b-${index}`} style={styles.bulletList}>
              {block.items.map((item, itemIndex) => (
                <View key={`${index}-${itemIndex}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bodyText}>{item}</Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text key={`p-${index}`} style={styles.bodyText}>
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      gap: 14,
    },
    answerCard: {
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: AI_UI.goldSoft,
      borderWidth: 1,
      borderColor: 'rgba(201,162,75,0.28)',
    },
    answerRail: {
      width: 4,
      backgroundColor: AI_UI.gold,
    },
    answerInner: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 4,
    },
    answerLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: AI_UI.goldDeep,
    },
    answerText: {
      fontSize: 17,
      lineHeight: 24,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.ink,
    },
    section: {
      gap: 8,
    },
    sectionLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: AI_UI.primaryMuted,
    },
    bodyText: {
      flex: 1,
      fontSize: 14.5,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.ui.medium,
      fontWeight: '500',
      color: AI_UI.body,
    },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: 14,
      backgroundColor: 'rgba(201,162,75,0.1)',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tipCopy: {
      flex: 1,
      gap: 2,
    },
    tipLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: AI_UI.goldDeep,
    },
    tipText: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: theme.typography.fonts.ui.medium,
      color: AI_UI.body,
    },
    formula: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: AI_UI.primaryLight,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    formulaLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: AI_UI.sub,
    },
    formulaText: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.stat.medium,
      fontWeight: '700',
      color: AI_UI.primary,
    },
    bulletList: {
      gap: 8,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    bulletDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: AI_UI.gold,
      marginTop: 8,
    },
  });
}
