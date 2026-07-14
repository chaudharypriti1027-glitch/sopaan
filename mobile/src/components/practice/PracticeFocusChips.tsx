import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { platformShadow } from '../../utils/platformShadow';
import { practiceFadeInDown } from './practiceMotion';

type PracticeFocusChipsProps = {
  title: string;
  topics: string[];
  onSelect: (topic: string) => void;
};

export function PracticeFocusChips({ title, topics, onSelect }: PracticeFocusChipsProps) {
  const styles = useMemo(() => createStyles(), []);

  if (!topics.length) {
    return null;
  }

  return (
    <Animated.View entering={practiceFadeInDown(1)} style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Sparkles size={12} color={PRACTICE_UI.goldBadge} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {topics.map((topic) => (
          <Pressable
            key={topic}
            accessibilityRole="button"
            onPress={() => onSelect(topic)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Text style={styles.chipText}>{topic}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      gap: 10,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.06)',
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 3,
        opacity: 0.06,
        radius: 12,
        elevation: 1,
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBadge: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(245,158,11,0.12)',
    },
    title: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: PRACTICE_UI.ink,
    },
    row: {
      gap: 8,
      paddingRight: 4,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: PRACTICE_UI.statIndigoBg,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.08)',
    },
    chipPressed: {
      backgroundColor: '#E8EBF8',
      borderColor: 'rgba(35,42,77,0.14)',
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: PRACTICE_UI.ink,
      lineHeight: 18,
    },
  });
}
