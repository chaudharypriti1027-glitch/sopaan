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
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../Text';
import { CA_UI, caChip, caPressFeedback } from './caTheme';

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
  gradient: readonly [string, string];
}[] = [
  { key: 'all', apiValue: null, Icon: Star, color: CA_UI.accent, bg: CA_UI.accent, gradient: [CA_UI.accent, '#1A1F3B'] },
  { key: 'economy', apiValue: 'Economy', Icon: DollarSign, color: '#4C7264', bg: '#568274', gradient: ['#6A9A88', '#426A5C'] },
  { key: 'international', apiValue: 'International', Icon: Globe, color: '#3B4B6E', bg: '#4C6084', gradient: ['#5E7296', '#3A4E6E'] },
  { key: 'defence', apiValue: 'Defence', Icon: Shield, color: '#A8503E', bg: '#A86452', gradient: ['#C07866', '#8C5040'] },
  { key: 'schemes', apiValue: 'Schemes', Icon: Scale, color: '#5C4030', bg: '#6A4838', gradient: ['#8A5840', '#4A3020'] },
  { key: 'politics', apiValue: 'Polity', Icon: Landmark, color: '#A67C33', bg: '#B89442', gradient: ['#D4B066', '#8F7028'] },
  { key: 'health', apiValue: 'Science', Icon: Heart, color: '#A8503E', bg: '#C07866', gradient: ['#D08878', '#A8503E'] },
  { key: 'environment', apiValue: 'Environment', Icon: Leaf, color: '#4C7264', bg: '#568274', gradient: ['#6A9A88', '#3E5E50'] },
  { key: 'scienceTech', apiValue: 'Science', Icon: Cpu, color: '#3A4E6E', bg: '#4C6084', gradient: ['#6888B0', '#3E5E88'] },
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
        {CA_CATEGORY_OPTIONS.map(({ key, Icon, color, gradient }) => {
          const active = selected === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(key)}
              style={({ pressed }) => [pressed && caPressFeedback]}
            >
              {active ? (
                <LinearGradient
                  colors={[...gradient]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.pillActive}
                >
                  <View style={styles.pillSheen} />
                  <Icon size={11} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.pillTextActive}>{t(`currentAffairs.${key}`)}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.pill}>
                  <Icon size={11} color={color} strokeWidth={2.5} />
                  <Text style={styles.pillText}>{t(`currentAffairs.${key}`)}</Text>
                </View>
              )}
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
      backgroundColor: CA_UI.bg,
      paddingBottom: 4,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 6,
      ...caChip(),
    },
    pillActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 6,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    pillSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    pillText: {
      fontSize: 11,
      fontWeight: '700',
      color: CA_UI.muted,
    },
    pillTextActive: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
      zIndex: 1,
    },
  });
}
