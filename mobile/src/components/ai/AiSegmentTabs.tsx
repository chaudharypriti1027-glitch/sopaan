import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardCheck, Sparkles } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AskAiTab } from '../../content/askAiContent';
import { AI_UI, aiPressFeedback } from './aiTheme';

type AiSegmentTabsProps = {
  value: AskAiTab;
  onChange: (tab: AskAiTab) => void;
  askLabel: string;
  evaluateLabel: string;
};

const TAB_ICONS = {
  ask: Sparkles,
  evaluate: ClipboardCheck,
} as const;

export function AiSegmentTabs({ value, onChange, askLabel, evaluateLabel }: AiSegmentTabsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.track}>
      {(['ask', 'evaluate'] as const).map((tab) => {
        const selected = value === tab;
        const Icon = TAB_ICONS[tab];
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && aiPressFeedback]}
          >
            {selected ? (
              <LinearGradient
                colors={[AI_UI.primary, AI_UI.gradientEnd]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <Icon size={15} color="#FFFFFF" strokeWidth={2.25} />
                <Text style={[styles.tabLabel, styles.tabLabelSelected]}>
                  {tab === 'ask' ? askLabel : evaluateLabel}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInner}>
                <Icon size={15} color={AI_UI.sub} strokeWidth={1.9} />
                <Text style={styles.tabLabel}>{tab === 'ask' ? askLabel : evaluateLabel}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    track: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: 16,
      backgroundColor: AI_UI.card,
      borderWidth: 1,
      borderColor: AI_UI.goldBorder,
      gap: 4,
    },
    tab: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    tabSelected: {
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 3,
    },
    tabGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      paddingHorizontal: 8,
    },
    tabInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      paddingHorizontal: 8,
    },
    tabLabel: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.sub,
    },
    tabLabelSelected: {
      color: '#FFFFFF',
    },
  });
}

export type { AskAiTab as AiTab };
