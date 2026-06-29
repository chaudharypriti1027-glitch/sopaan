import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';

export type PracticeTab = 'sectional' | 'mock' | 'pyq';

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
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
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
      gap: 4,
      backgroundColor: PRACTICE_UI.tabBg,
      borderRadius: 18,
      padding: 4,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 14,
    },
    tabActive: {
      backgroundColor: '#FFFFFF',
      shadowColor: PRACTICE_UI.startEnd,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 2,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: PRACTICE_UI.tabMuted,
      textAlign: 'center',
    },
    tabLabelActive: {
      color: PRACTICE_UI.tabActive,
    },
  });
}
