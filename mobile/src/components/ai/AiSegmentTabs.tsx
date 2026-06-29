import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ClipboardCheck, Sparkles } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';

type AiTab = 'ask' | 'evaluate';

type AiSegmentTabsProps = {
  value: AiTab;
  onChange: (tab: AiTab) => void;
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
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Icon
              size={15}
              color={selected ? '#FFFFFF' : AI_UI.sub}
              strokeWidth={selected ? 2.25 : 1.9}
            />
            <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
              {tab === 'ask' ? askLabel : evaluateLabel}
            </Text>
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
      backgroundColor: AI_UI.primaryLight,
      borderWidth: 1.5,
      borderColor: AI_UI.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    tabSelected: {
      backgroundColor: AI_UI.primary,
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 18,
      elevation: 3,
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

export type { AiTab };
