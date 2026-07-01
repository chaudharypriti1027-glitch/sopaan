import { LinearGradient } from 'expo-linear-gradient';
import { FilePlus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PRACTICE_UI, AVATAR_GRADIENTS, avatarToneForIndex, type PracticeAvatarTone } from './practiceTheme';

type PracticeTestRowProps = {
  avatarLabel: string;
  avatarTone?: PracticeAvatarTone;
  title: string;
  titleMuted?: string;
  meta: string;
  startLabel: string;
  onPress: () => void;
};

export function PracticeTestRow({
  avatarLabel,
  avatarTone = 'purple',
  title,
  titleMuted,
  meta,
  startLabel,
  onPress,
}: PracticeTestRowProps) {
  const styles = useMemo(() => createStyles(), []);
  const avatarColors = AVATAR_GRADIENTS[avatarTone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <LinearGradient colors={avatarColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLabel}</Text>
      </LinearGradient>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
          {titleMuted ? <Text style={styles.titleMuted}> — {titleMuted}</Text> : null}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <LinearGradient
        colors={[PRACTICE_UI.startStart, PRACTICE_UI.startEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.startBtn}
      >
        <Text style={styles.startText}>{startLabel}</Text>
      </LinearGradient>
    </Pressable>
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
        <View key={test.id}>
          <PracticeTestRow
            avatarLabel={test.avatarLabel}
            avatarTone={test.avatarTone ?? avatarToneForIndex(index)}
            title={test.title}
            titleMuted={test.titleMuted}
            meta={test.meta}
            startLabel={startLabel}
            onPress={() => onStart(test.id)}
          />
          {index < tests.length - 1 ? <View style={styles.divider} /> : null}
        </View>
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
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {countLabel ? <Text style={styles.sectionCount}>{countLabel}</Text> : null}
    </View>
  );
}

type PracticeEmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function PracticeEmptyState({ title, description, actionLabel, onAction }: PracticeEmptyStateProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.empty}>
      <LinearGradient colors={['#E9EBF3', '#C0C4DB']} style={styles.emptyIcon}>
        <FilePlus size={28} color={PRACTICE_UI.startEnd} strokeWidth={2} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>
      <Pressable onPress={onAction} style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient
          colors={[PRACTICE_UI.startStart, PRACTICE_UI.startEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.genBtn}
        >
          <Text style={styles.genBtnText}>{actionLabel}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    list: {
      backgroundColor: PRACTICE_UI.card,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: PRACTICE_UI.startEnd,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    pressed: {
      backgroundColor: '#F8FAFC',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#F1F5F9',
      marginLeft: 70,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 14,
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
      fontSize: 13,
      fontWeight: '600',
      color: PRACTICE_UI.ink,
    },
    titleMuted: {
      fontWeight: '400',
      color: PRACTICE_UI.muted,
    },
    meta: {
      fontSize: 11,
      color: PRACTICE_UI.meta,
      marginTop: 2,
    },
    startBtn: {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      shadowColor: PRACTICE_UI.startEnd,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 2,
    },
    startText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: PRACTICE_UI.sectionLabel,
    },
    sectionCount: {
      fontSize: 12,
      fontWeight: '600',
      color: PRACTICE_UI.sectionCount,
    },
    empty: {
      backgroundColor: PRACTICE_UI.card,
      borderRadius: 20,
      paddingVertical: 40,
      paddingHorizontal: 20,
      alignItems: 'center',
      gap: 10,
      shadowColor: PRACTICE_UI.startEnd,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
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
      fontWeight: '600',
      color: '#334155',
    },
    emptyDesc: {
      fontSize: 13,
      color: PRACTICE_UI.sectionLabel,
      textAlign: 'center',
      lineHeight: 19,
      maxWidth: 220,
    },
    genBtn: {
      marginTop: 8,
      borderRadius: 12,
      paddingHorizontal: 22,
      paddingVertical: 10,
      shadowColor: PRACTICE_UI.startEnd,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 2,
    },
    genBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
