import { LinearGradient } from 'expo-linear-gradient';
import { FilePlus, Play } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '../Text';
import { PRACTICE_UI, AVATAR_GRADIENTS, avatarToneForIndex, type PracticeAvatarTone } from './practiceTheme';
import { platformShadow } from '../../utils/platformShadow';
import { practiceFadeInDown, practiceFadeIn } from './practiceMotion';

type PracticeTestRowProps = {
  avatarLabel: string;
  avatarTone?: PracticeAvatarTone;
  title: string;
  titleMuted?: string;
  meta: string;
  startLabel: string;
  onPress: () => void;
  index?: number;
};

export function PracticeTestRow({
  avatarLabel,
  avatarTone = 'purple',
  title,
  titleMuted,
  meta,
  startLabel,
  onPress,
  index = 0,
}: PracticeTestRowProps) {
  const styles = useMemo(() => createStyles(), []);
  const avatarColors = AVATAR_GRADIENTS[avatarTone];

  return (
    <Animated.View entering={practiceFadeInDown(index)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
      >
      <LinearGradient colors={avatarColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLabel}</Text>
      </LinearGradient>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {titleMuted ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {titleMuted}
          </Text>
        ) : null}
        <Text style={styles.meta} numberOfLines={2}>
          {meta}
        </Text>
      </View>

      <View style={styles.startWrap}>
        <LinearGradient
          colors={[PRACTICE_UI.goldCtaStart, PRACTICE_UI.goldCtaEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startBtn}
        >
          <Play size={11} color={PRACTICE_UI.goldCtaText} fill={PRACTICE_UI.goldCtaText} strokeWidth={0} />
          <Text style={styles.startText}>{startLabel}</Text>
        </LinearGradient>
      </View>
      </Pressable>
    </Animated.View>
  );
}

type PracticeTestListProps = {
  tests: {
    id: string;
    avatarLabel: string;
    avatarTone?: PracticeAvatarTone;
    title: string;
    titleMuted?: string;
    meta: string;
  }[];
  startLabel: string;
  onStart: (testId: string) => void;
};

export function PracticeTestList({ tests, startLabel, onStart }: PracticeTestListProps) {
  const styles = useMemo(() => createStyles(), []);

  if (!tests.length) {
    return null;
  }

  return (
    <View style={styles.list}>
      {tests.map((test, index) => (
        <PracticeTestRow
          key={test.id}
          index={index}
          avatarLabel={test.avatarLabel}
          avatarTone={test.avatarTone ?? avatarToneForIndex(index)}
          title={test.title}
          titleMuted={test.titleMuted}
          meta={test.meta}
          startLabel={startLabel}
          onPress={() => onStart(test.id)}
        />
      ))}
    </View>
  );
}

type PracticeSectionHeaderProps = {
  label: string;
  countLabel?: string;
};

export function PracticeSectionHeader({ label, countLabel }: PracticeSectionHeaderProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Animated.View entering={practiceFadeIn(0)} style={styles.sectionHeader}>
      <View style={styles.sectionLabelRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
      {countLabel ? <Text style={styles.sectionCount}>{countLabel}</Text> : null}
    </Animated.View>
  );
}

type PracticeEmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function PracticeEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: PracticeEmptyStateProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Animated.View entering={practiceFadeInDown(0, 50, 420)} style={styles.empty}>
      <LinearGradient colors={['#F6EDDA', '#EFE0BC']} style={styles.emptyIcon}>
        <FilePlus size={28} color={PRACTICE_UI.goldDeep} strokeWidth={2} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>
      <Pressable onPress={onAction} style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient
          colors={[PRACTICE_UI.goldCtaStart, PRACTICE_UI.goldCtaEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.genBtn}
        >
          <Text style={styles.genBtnText}>{actionLabel}</Text>
        </LinearGradient>
      </Pressable>
      {secondaryActionLabel && onSecondaryAction ? (
        <Pressable onPress={onSecondaryAction} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
          <Text style={styles.secondaryBtnText}>{secondaryActionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    list: {
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      backgroundColor: PRACTICE_UI.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(201,162,75,0.18)',
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 4,
        opacity: 0.07,
        radius: 14,
        elevation: 2,
      }),
    },
    pressed: {
      opacity: 0.92,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: PRACTICE_UI.ink,
      lineHeight: 19,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: PRACTICE_UI.muted,
      marginTop: 2,
      lineHeight: 17,
    },
    meta: {
      fontSize: 11,
      color: PRACTICE_UI.meta,
      marginTop: 4,
      lineHeight: 15,
    },
    startWrap: {
      flexShrink: 0,
      marginTop: 2,
    },
    startBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...platformShadow({
        color: PRACTICE_UI.goldCtaEnd,
        offsetY: 3,
        opacity: 0.32,
        radius: 8,
        elevation: 2,
      }),
    },
    startText: {
      fontSize: 11,
      fontWeight: '800',
      color: PRACTICE_UI.goldCtaText,
      letterSpacing: 0.3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: PRACTICE_UI.goldBadge,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: PRACTICE_UI.sectionLabel,
    },
    sectionCount: {
      fontSize: 12,
      fontWeight: '700',
      color: PRACTICE_UI.sectionCount,
      backgroundColor: PRACTICE_UI.statIndigoBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    empty: {
      backgroundColor: PRACTICE_UI.card,
      borderRadius: 20,
      paddingVertical: 40,
      paddingHorizontal: 20,
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.06)',
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 4,
        opacity: 0.08,
        radius: 16,
        elevation: 2,
      }),
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: PRACTICE_UI.ink,
    },
    emptyDesc: {
      fontSize: 14,
      color: PRACTICE_UI.muted,
      textAlign: 'center',
      lineHeight: 21,
      paddingHorizontal: 8,
    },
    genBtn: {
      marginTop: 8,
      borderRadius: 12,
      paddingHorizontal: 22,
      paddingVertical: 10,
      ...platformShadow({
        color: PRACTICE_UI.goldCtaEnd,
        offsetY: 3,
        opacity: 0.32,
        radius: 8,
        elevation: 2,
      }),
    },
    genBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: PRACTICE_UI.goldCtaText,
    },
    secondaryBtn: {
      marginTop: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    secondaryBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: PRACTICE_UI.startEnd,
    },
  });
}
