import type { LucideIcon } from 'lucide-react-native';
import {
  Cpu,
  DollarSign,
  Globe,
  Heart,
  Leaf,
  Landmark,
  Scale,
  Shield,
  Star,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { CA_UI } from './caTheme';

export type CaCategoryKey =
  | 'all'
  | 'economy'
  | 'international'
  | 'defence'
  | 'schemes'
  | 'politics'
  | 'health'
  | 'environment'
  | 'scienceTech';

export const CA_CATEGORY_OPTIONS: {
  key: CaCategoryKey;
  apiValue: string | null;
  Icon: LucideIcon;
  color: string;
  bg: string;
}[] = [
  { key: 'all', apiValue: null, Icon: Star, color: '#1E293B', bg: '#1E293B' },
  { key: 'economy', apiValue: 'Economy', Icon: DollarSign, color: '#059669', bg: '#059669' },
  { key: 'international', apiValue: 'International', Icon: Globe, color: '#2563EB', bg: '#2563EB' },
  { key: 'defence', apiValue: 'Defence', Icon: Shield, color: '#DC2626', bg: '#DC2626' },
  { key: 'schemes', apiValue: 'Schemes', Icon: Scale, color: '#7C3AED', bg: '#7C3AED' },
  { key: 'politics', apiValue: 'Polity', Icon: Landmark, color: '#EA580C', bg: '#EA580C' },
  { key: 'health', apiValue: 'Science', Icon: Heart, color: '#DB2777', bg: '#DB2777' },
  { key: 'environment', apiValue: 'Environment', Icon: Leaf, color: '#16A34A', bg: '#16A34A' },
  { key: 'scienceTech', apiValue: 'Science', Icon: Cpu, color: '#0891B2', bg: '#0891B2' },
];

type CaCategoryPillsProps = {
  selected: CaCategoryKey;
  onSelect: (key: CaCategoryKey) => void;
};

export function CaCategoryPills({ selected, onSelect }: CaCategoryPillsProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {CA_CATEGORY_OPTIONS.map(({ key, Icon, color, bg }) => {
          const active = selected === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(key)}
              style={({ pressed }) => [
                styles.pill,
                active && { backgroundColor: bg, borderColor: bg },
                pressed && styles.pressed,
              ]}
            >
              <Icon size={11} color={active ? '#FFFFFF' : color} strokeWidth={2.5} />
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {t(`currentAffairs.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      backgroundColor: CA_UI.surface,
      borderBottomWidth: 1,
      borderBottomColor: CA_UI.border,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 6,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: CA_UI.borderStrong,
      marginRight: 6,
    },
    pillText: {
      fontSize: 11,
      fontWeight: '600',
      color: CA_UI.muted,
    },
    pillTextActive: {
      color: '#FFFFFF',
    },
    pressed: { opacity: 0.9 },
  });
}
