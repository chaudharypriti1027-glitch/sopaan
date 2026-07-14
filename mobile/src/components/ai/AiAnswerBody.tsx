import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Lightbulb, Sparkles } from 'lucide-react-native';
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
  tipLabel = 'Exam tip',
}: AiAnswerBodyProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const blocks = useMemo(() => parseAiAnswer(text), [text]);

  return (
    <View style={styles.wrap}>
      {blocks.map((block, index) => {
        if (block.type === 'answer') {
          return (
            <View key={`a-${index}`} style={styles.answerShell}>
              <View style={styles.answerAccent} />
              <LinearGradient
                colors={['#FFFCF6', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.answerCard}
              >
                <View style={styles.answerHeader}>
                  <Sparkles size={12} color={AI_UI.goldDeep} strokeWidth={2.4} />
                  <Text style={styles.answerLabel}>{answerLabel}</Text>
                </View>
                <Text style={styles.answerText}>{block.text}</Text>
              </LinearGradient>
            </View>
          );
        }

        if (block.type === 'explanation') {
          return (
            <View key={`e-${index}`} style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <BookOpen size={13} color={AI_UI.primary} strokeWidth={2.2} />
                <Text style={styles.explanationLabel}>{explanationLabel}</Text>
              </View>
              {block.bullets?.length ? (
                <View style={styles.bulletList}>
                  {block.bullets.map((item, itemIndex) => (
                    <View key={`${index}-${itemIndex}`} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.explanationText}>{block.text}</Text>
              )}
            </View>
          );
        }

        if (block.type === 'tip') {
          return (
            <View key={`t-${index}`} style={styles.tipCard}>
              <View style={styles.tipIconWrap}>
                <Lightbulb size={14} color={AI_UI.goldDeep} />
              </View>
              <View style={styles.tipCopy}>
                <Text style={styles.tipLabel}>{tipLabel}</Text>
                <Text style={styles.tipText}>{block.text}</Text>
              </View>
            </View>
          );
        }

        if (block.type === 'heading') {
          return (
            <View key={`h-${index}`} style={styles.headingRow}>
              <Sparkles size={11} color={AI_UI.primary} />
              <Text style={styles.heading}>{block.text}</Text>
            </View>
          );
        }

        if (block.type === 'formula') {
          return (
            <View key={`f-${index}`} style={styles.formulaPill}>
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
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text key={`p-${index}`} style={styles.paragraph}>
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
      gap: theme.spacing.md,
    },
    answerShell: {
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: AI_UI.goldDeep,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 3,
    },
    answerAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: AI_UI.gold,
      zIndex: 1,
    },
    answerCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.32)',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
    },
    answerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    answerLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: AI_UI.goldDeep,
    },
    answerText: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.ink,
    },
    explanationCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: AI_UI.border,
      backgroundColor: '#FAFBFD',
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
    },
    explanationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    explanationLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: AI_UI.primaryMuted,
    },
    explanationText: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.ui.medium,
      color: AI_UI.body,
    },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: 14,
      backgroundColor: AI_UI.goldSoft,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.22)',
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    tipIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.72)',
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
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    heading: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: AI_UI.primaryMuted,
    },
    paragraph: {
      fontSize: 14.5,
      lineHeight: 23,
      fontFamily: theme.typography.fonts.ui.medium,
      fontWeight: '500',
      color: AI_UI.ink,
    },
    formulaPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: AI_UI.primaryLight,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    formulaLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.6,
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
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: AI_UI.primary,
      marginTop: 8,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: theme.typography.fonts.ui.medium,
      color: AI_UI.body,
    },
  });
}
