import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';
import { parseAiAnswer } from '../../utils/parseAiAnswer';

type AiAnswerBodyProps = {
  text: string;
  formulaLabel: string;
};

export function AiAnswerBody({ text, formulaLabel }: AiAnswerBodyProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const blocks = useMemo(() => parseAiAnswer(text), [text]);

  return (
    <View style={styles.wrap}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text key={`h-${index}`} style={styles.heading}>
              {block.text}
            </Text>
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
    heading: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: AI_UI.primaryMuted,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 22,
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
      marginTop: 7,
    },
    bulletText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.ui.medium,
      color: AI_UI.body,
    },
  });
}
