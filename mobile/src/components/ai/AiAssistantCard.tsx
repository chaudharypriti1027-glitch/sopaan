import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bookmark,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AiAvatar } from './AiAvatar';
import { AiAnswerBody } from './AiAnswerBody';
import { ASK_AI_INSTANT_MS } from '../../content/askAiContent';
import { AI_UI } from './aiTheme';

type AiAssistantCardProps = {
  text: string;
  coachName: string;
  fromCache?: boolean;
  cacheLabel?: string;
  instantLabel?: string;
  formulaLabel: string;
  copyLabel: string;
  copiedLabel: string;
  helpfulLabel: string;
  notHelpfulLabel: string;
  retryLabel: string;
  saveLabel: string;
  savedLabel: string;
  saving?: boolean;
  saved?: boolean;
  responseMs?: number;
  onRetry?: () => void;
  onNotHelpful?: () => void;
  onHelpful?: () => void;
  onSave?: () => void;
  answerLabel?: string;
  explanationLabel?: string;
  tipLabel?: string;
  cacheSourceLabel?: string;
};

export function AiAssistantCard({
  text,
  coachName,
  fromCache,
  cacheLabel,
  instantLabel,
  formulaLabel,
  copyLabel,
  copiedLabel,
  helpfulLabel,
  notHelpfulLabel,
  retryLabel,
  saveLabel,
  savedLabel,
  saving,
  saved,
  responseMs,
  onRetry,
  onNotHelpful,
  onHelpful,
  onSave,
  answerLabel,
  explanationLabel,
  tipLabel,
  cacheSourceLabel,
}: AiAssistantCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<null | 'up' | 'down'>(null);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.row}>
      <AiAvatar size={36} />
      <View style={styles.card}>
        <LinearGradient
          colors={[AI_UI.primary, AI_UI.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardHeader}
        >
          <View style={styles.headerLeft}>
            <Sparkles size={12} color={AI_UI.gold} strokeWidth={2.4} />
            <Text style={styles.headerTitle}>{coachName}</Text>
          </View>
          <View style={styles.headerBadges}>
            {fromCache && (cacheSourceLabel || cacheLabel) ? (
              <View style={styles.badge}>
                <Zap size={10} color={AI_UI.gold} />
                <Text style={styles.badgeText}>{cacheSourceLabel ?? cacheLabel}</Text>
              </View>
            ) : null}
            {typeof responseMs === 'number' && responseMs < ASK_AI_INSTANT_MS && !fromCache ? (
              <Text style={styles.speedText}>{instantLabel}</Text>
            ) : null}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <AiAnswerBody
            text={text}
            formulaLabel={formulaLabel}
            answerLabel={answerLabel}
            explanationLabel={explanationLabel}
            tipLabel={tipLabel}
          />
        </View>

        <View style={styles.actions}>
          <ActionBtn
            icon={copied ? Check : Copy}
            label={copied ? copiedLabel : copyLabel}
            active={copied}
            onPress={() => void handleCopy()}
          />
          <ActionBtn
            icon={ThumbsUp}
            label={helpfulLabel}
            active={liked === 'up'}
            onPress={() => {
              const next = liked === 'up' ? null : 'up';
              setLiked(next);
              if (next === 'up') {
                onHelpful?.();
              }
            }}
          />
          <ActionBtn
            icon={ThumbsDown}
            label={notHelpfulLabel}
            active={liked === 'down'}
            onPress={() => {
              setLiked(liked === 'down' ? null : 'down');
              onNotHelpful?.();
            }}
          />
          {onSave ? (
            <ActionBtn
              icon={saved ? Check : Bookmark}
              label={saving ? '...' : saved ? savedLabel : saveLabel}
              active={saved}
              onPress={onSave}
              disabled={saving || saved}
            />
          ) : null}
          <View style={styles.spacer} />
          {onRetry ? (
            <ActionBtn icon={RotateCcw} label={retryLabel} onPress={onRetry} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onPress,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[actionStyles.btn, active && actionStyles.btnActive, disabled && actionStyles.disabled]}
    >
      {label === '...' ? (
        <ActivityIndicator size="small" color={AI_UI.primary} />
      ) : (
        <Icon size={12} color={active ? AI_UI.primary : AI_UI.sub} strokeWidth={2.2} />
      )}
      <Text style={[actionStyles.label, active && actionStyles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActive: {
    backgroundColor: AI_UI.primaryLight,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: AI_UI.sub,
  },
  labelActive: {
    color: AI_UI.primary,
  },
});

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    card: {
      flex: 1,
      minWidth: 0,
      borderRadius: AI_UI.cardRadius,
      borderTopLeftRadius: 6,
      overflow: 'hidden',
      backgroundColor: AI_UI.card,
      borderWidth: 1,
      borderColor: AI_UI.goldBorder,
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
      elevation: 6,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: AI_UI.primaryLight,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitle: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    headerBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.goldSoft,
    },
    speedText: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.75)',
    },
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      backgroundColor: '#FDFCF8',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 2,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: AI_UI.goldBorder,
      backgroundColor: AI_UI.goldSoft,
    },
    spacer: {
      flex: 1,
    },
  });
}
