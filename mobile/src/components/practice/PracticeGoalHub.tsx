import { BookOpen, Gamepad2, Sparkles, Target } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { platformShadow } from '../../utils/platformShadow';
import { practiceFadeInDown } from './practiceMotion';

type PracticeGoalHubProps = {
  hasGoal: boolean;
  examName?: string;
  daysLeft?: number | null;
  dreamMessage?: string;
  setGoalTitle: string;
  setGoalBody: string;
  setGoalAction: string;
  examPlanLabel: string;
  askAiLabel: string;
  gamesLabel: string;
  todayPlanLine?: string;
  onSetGoal: () => void;
  onExamPlan: () => void;
  onAskAi: () => void;
  onGames: () => void;
};

export function PracticeGoalHub({
  hasGoal,
  examName,
  daysLeft,
  dreamMessage,
  setGoalTitle,
  setGoalBody,
  setGoalAction,
  examPlanLabel,
  askAiLabel,
  gamesLabel,
  todayPlanLine,
  onSetGoal,
  onExamPlan,
  onAskAi,
  onGames,
}: PracticeGoalHubProps) {
  const styles = useMemo(() => createStyles(), []);

  if (!hasGoal) {
    return (
      <Animated.View entering={practiceFadeInDown(0)} style={styles.cardShell}>
        <View style={styles.accent} />
        <LinearGradient
          colors={['#FFFDF7', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goalCard}
        >
          <View style={styles.goalHeader}>
            <View style={styles.iconBadge}>
              <Target size={15} color={PRACTICE_UI.goldBadge} strokeWidth={2.3} />
            </View>
            <Text style={styles.goalTitle}>{setGoalTitle}</Text>
          </View>
          <Text style={styles.goalBody}>{setGoalBody}</Text>
          <Pressable accessibilityRole="button" onPress={onSetGoal} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{setGoalAction}</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    );
  }

  const planLine = todayPlanLine ?? null;

  return (
    <Animated.View entering={practiceFadeInDown(0)} style={styles.cardShell}>
      <View style={styles.accent} />
      <LinearGradient
        colors={['#FFFDF7', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.goalCard}
      >
        <View style={styles.goalTopRow}>
          <View style={styles.examBadge}>
            <Target size={12} color={PRACTICE_UI.goldBadge} strokeWidth={2.2} />
            <Text style={styles.examBadgeText} numberOfLines={2}>
              {examName}
            </Text>
          </View>
          {typeof daysLeft === 'number' ? (
            <View style={styles.daysPill}>
              <Text style={styles.daysLeft}>{daysLeft}d left</Text>
            </View>
          ) : null}
        </View>

        {dreamMessage ? (
          <Text style={styles.dreamLine} numberOfLines={3}>
            {dreamMessage}
          </Text>
        ) : null}
        {planLine ? <Text style={styles.planLine}>{planLine}</Text> : null}

        <View style={styles.actions}>
          <QuickAction icon={BookOpen} label={examPlanLabel} onPress={onExamPlan} />
          <QuickAction icon={Sparkles} label={askAiLabel} onPress={onAskAi} accent />
          <QuickAction icon={Gamepad2} label={gamesLabel} onPress={onGames} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onPress,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[quickStyles.btn, accent && quickStyles.btnAccent]}
    >
      <Icon
        size={15}
        color={accent ? PRACTICE_UI.goldBadge : PRACTICE_UI.startEnd}
        strokeWidth={2.2}
      />
      <Text style={[quickStyles.label, accent && quickStyles.labelAccent]}>{label}</Text>
    </Pressable>
  );
}

const quickStyles = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: PRACTICE_UI.statIndigoBg,
    borderWidth: 1,
    borderColor: 'rgba(35,42,77,0.08)',
  },
  btnAccent: {
    backgroundColor: 'rgba(201,162,75,0.14)',
    borderColor: 'rgba(201,162,75,0.32)',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: PRACTICE_UI.startEnd,
    textAlign: 'center',
    lineHeight: 14,
  },
  labelAccent: {
    color: PRACTICE_UI.statAmber,
  },
});

function createStyles() {
  return StyleSheet.create({
    cardShell: {
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 6,
        opacity: 0.1,
        radius: 18,
        elevation: 3,
      }),
    },
    accent: {
      position: 'absolute',
      top: 0,
      left: '30%',
      right: '30%',
      height: 2,
      borderRadius: 1,
      backgroundColor: PRACTICE_UI.goldBadge,
      zIndex: 1,
      opacity: 0.8,
    },
    goalCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(201,162,75,0.22)',
      padding: 14,
      gap: 10,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(201,162,75,0.16)',
    },
    goalTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      color: PRACTICE_UI.ink,
    },
    goalBody: {
      fontSize: 13,
      lineHeight: 19,
      color: PRACTICE_UI.meta,
    },
    primaryBtn: {
      alignSelf: 'flex-start',
      backgroundColor: PRACTICE_UI.startEnd,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 3,
        opacity: 0.25,
        radius: 8,
        elevation: 2,
      }),
    },
    primaryBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    goalTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    examBadge: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: PRACTICE_UI.statAmberBg,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    examBadgeText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '800',
      color: PRACTICE_UI.statAmber,
      lineHeight: 16,
    },
    daysPill: {
      backgroundColor: PRACTICE_UI.statIndigoBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    daysLeft: {
      fontSize: 11,
      fontWeight: '800',
      color: PRACTICE_UI.ink,
      flexShrink: 0,
    },
    dreamLine: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: PRACTICE_UI.ink,
    },
    planLine: {
      fontSize: 12,
      fontWeight: '600',
      color: PRACTICE_UI.statGreen,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
  });
}
