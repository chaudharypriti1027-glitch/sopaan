import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { platformShadow } from '../../utils/platformShadow';

type PracticeGenerateCtaProps = {
  title: string;
  hint: string;
  onPress: () => void;
  testID?: string;
};

/** One-row gold CTA in the Practice header — opens the Generate Test screen. */
export function PracticeGenerateCta({ title, hint, onPress, testID }: PracticeGenerateCtaProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      testID={testID ?? 'practice-ai-generate-card'}
    >
      <LinearGradient
        colors={[PRACTICE_UI.goldCtaStart, PRACTICE_UI.goldCtaEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.icon}
      >
        <Sparkles size={17} color={PRACTICE_UI.goldCtaText} strokeWidth={2.3} />
      </LinearGradient>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.hint} numberOfLines={1}>
          {hint}
        </Text>
      </View>
      <ChevronRight size={18} color={PRACTICE_UI.gold} strokeWidth={2.4} />
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(240,212,136,0.28)',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...platformShadow({
        color: '#000000',
        offsetY: 8,
        opacity: 0.12,
        radius: 16,
        elevation: 3,
      }),
    },
    pressed: {
      opacity: 0.94,
      transform: [{ scale: 0.99 }],
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    hint: {
      fontSize: 12,
      lineHeight: 16,
      color: 'rgba(233,222,196,0.75)',
    },
  });
}
