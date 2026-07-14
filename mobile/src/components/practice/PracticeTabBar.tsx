import { CalendarDays, FileStack, Layers } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { platformShadow } from '../../utils/platformShadow';

export type PracticeTab = 'sectional' | 'mock' | 'pyq';

const TAB_ICONS = {
  sectional: Layers,
  mock: FileStack,
  pyq: CalendarDays,
} as const;

type PracticeTabBarProps = {
  tabs: { key: PracticeTab; label: string }[];
  active: PracticeTab;
  onChange: (tab: PracticeTab) => void;
};

export function PracticeTabBar({ tabs, active, onChange }: PracticeTabBarProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const Icon = TAB_ICONS[tab.key];
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Icon
              size={14}
              color={isActive ? PRACTICE_UI.tabActive : PRACTICE_UI.tabMuted}
              strokeWidth={2.3}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: PRACTICE_UI.tabBg,
      borderRadius: 20,
      padding: 5,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.06)',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 15,
    },
    tabActive: {
      backgroundColor: '#FFFFFF',
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 3,
        opacity: 0.14,
        radius: 10,
        elevation: 2,
      }),
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: PRACTICE_UI.tabMuted,
      textAlign: 'center',
    },
    tabLabelActive: {
      color: PRACTICE_UI.tabActive,
    },
  });
}
