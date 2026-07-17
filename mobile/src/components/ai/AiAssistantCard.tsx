import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Bookmark,
  Check,
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AiAvatar } from './AiAvatar';
import { AiAnswerBody } from './AiAnswerBody';
import { AI_UI } from './aiTheme';

type AiAssistantCardProps = {
  text: string;
  coachName: string;
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
  onRetry?: () => void;
  onNotHelpful?: () => void;
  onHelpful?: () => void;
  onSave?: () => void;
  answerLabel?: string;
  explanationLabel?: string;
  tipLabel?: string;
  /** @deprecated kept for call-site compatibility */
  fromCache?: boolean;
  cacheLabel?: string;
  instantLabel?: string;
  responseMs?: number;
  cacheSourceLabel?: string;
};

export function AiAssistantCard({
  text,
  coachName,
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
  onRetry,
  onNotHelpful,
  onHelpful,
  onSave,
  answerLabel,
  explanationLabel,
  tipLabel,
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
      <AiAvatar size={32} />
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.headerTitle}>{coachName}</Text>
        </View>

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
          <IconAction
            icon={copied ? Check : Copy}
            label={copied ? copiedLabel : copyLabel}
            active={copied}
            onPress={() => void handleCopy()}
          />
          <IconAction
            icon={ThumbsUp}
            label={helpfulLabel}
            active={liked === 'up'}
            onPress={() => {
              const next = liked === 'up' ? null : 'up';
              setLiked(next);
              if (next === 'up') onHelpful?.();
            }}
          />
          <IconAction
            icon={ThumbsDown}
            label={notHelpfulLabel}
            active={liked === 'down'}
            onPress={() => {
              setLiked(liked === 'down' ? null : 'down');
              onNotHelpful?.();
            }}
          />
          {onSave ? (
            <IconAction
              icon={saved ? Check : Bookmark}
              label={saving ? savedLabel : saved ? savedLabel : saveLabel}
              active={saved}
              onPress={onSave}
              disabled={saving || saved}
              loading={saving}
            />
          ) : null}
          <View style={styles.spacer} />
          {onRetry ? (
            <IconAction icon={RotateCcw} label={retryLabel} onPress={onRetry} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function IconAction({
  icon: Icon,
  label,
  active,
  disabled,
  loading,
  onPress,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={[actionStyles.btn, active && actionStyles.btnActive, disabled && actionStyles.disabled]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={AI_UI.primary} />
      ) : (
        <Icon size={15} color={active ? AI_UI.primary : AI_UI.sub} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: AI_UI.primaryLight,
  },
  disabled: {
    opacity: 0.5,
  },
});

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
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
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 4,
    },
    cardHeader: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: 12,
      paddingBottom: 4,
    },
    headerTitle: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.primaryMuted,
    },
    body: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: 4,
      paddingBottom: theme.spacing.md,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: AI_UI.goldBorder,
      backgroundColor: '#FBF8F0',
    },
    spacer: {
      flex: 1,
    },
  });
}
