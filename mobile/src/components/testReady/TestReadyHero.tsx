import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { PracticeChip } from '../practice/PracticeChip';
import { ResultConfetti } from '../result/ResultConfetti';
import { RESULT_UI } from '../result/resultTheme';
import { PRACTICE_UI } from '../practice/practiceTheme';
import { TestReadyPulseOrb } from './TestReadyPulseOrb';

type TestReadyHeroProps = {
  badgeLabel: string;
  motivation: string;
  title: string;
  subtitle: string;
  questionCount: number;
  questionsLabel: string;
  examTag?: string;
  subject?: string;
  topic?: string;
  backLabel: string;
  onBack: () => void;
};

export function TestReadyHero({
  badgeLabel,
  motivation,
  title,
  subtitle,
  questionCount,
  questionsLabel,
  examTag,
  subject,
  topic,
  backLabel,
  onBack,
}: TestReadyHeroProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  return (
    <LinearGradient
      colors={[PRACTICE_UI.headerStart, PRACTICE_UI.headerMid, PRACTICE_UI.headerEnd]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <ResultConfetti active />

      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
        <View style={styles.badge}>
          <Sparkles size={12} color={PRACTICE_UI.gold} strokeWidth={2.4} />
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
        <View style={styles.iconSpacer} />
      </View>

      <Animated.View entering={ZoomIn.duration(520).delay(100)} style={styles.ringWrap}>
        <TestReadyPulseOrb size={128} />
        <View style={styles.ringCore}>
          <NumText style={styles.ringValue}>{questionCount}</NumText>
          <Text style={styles.ringLabel}>{questionsLabel}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(460).delay(220)} style={styles.copyBlock}>
        <Text style={styles.motivation}>{motivation}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(460).delay(300)} style={styles.chips}>
        {examTag ? <PracticeChip label={examTag} variant="amber" /> : null}
        {subject ? <PracticeChip label={subject} variant="purple" /> : null}
        {topic ? <PracticeChip label={topic} variant="green" /> : null}
      </Animated.View>
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    hero: {
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 64,
      alignItems: 'center',
      overflow: 'hidden',
      borderBottomLeftRadius: RESULT_UI.heroRadius,
      borderBottomRightRadius: RESULT_UI.heroRadius,
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    blobTop: {
      top: -70,
      right: -50,
      width: 220,
      height: 220,
    },
    blobBottom: {
      bottom: -40,
      left: -60,
      width: 180,
      height: 180,
      backgroundColor: 'rgba(227,201,127,0.08)',
    },
    topRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    iconSpacer: {
      width: 40,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: 'rgba(245,158,11,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.42)',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      color: PRACTICE_UI.gold,
    },
    ringWrap: {
      width: 128,
      height: 128,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    ringCore: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderWidth: 2,
      borderColor: 'rgba(194,154,78,0.5)',
    },
    ringValue: {
      fontSize: 34,
      fontWeight: '800',
      color: PRACTICE_UI.headerMid,
      lineHeight: 38,
    },
    ringLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: PRACTICE_UI.muted,
      marginTop: 2,
    },
    copyBlock: {
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 8,
    },
    motivation: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 32,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.94)',
      textAlign: 'center',
      lineHeight: 21,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: 'rgba(255,255,255,0.72)',
      textAlign: 'center',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
    },
    pressed: {
      opacity: 0.9,
    },
  });
}
