import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Hand, MessageCircle, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

const REACTIONS = ['👍', '🔥', '👏', '❤️'] as const;

type LiveClassOverlayControlsProps = {
  handRaised: boolean;
  connected: boolean;
  onRaiseHand: () => void;
  onLowerHand: () => void;
  onReaction: (emoji: string) => void;
  onSend: (text: string) => boolean;
};

export function LiveClassOverlayControls({
  handRaised,
  connected,
  onRaiseHand,
  onLowerHand,
  onReaction,
  onSend,
}: LiveClassOverlayControlsProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    if (onSend(text)) {
      setDraft('');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.reactBar}>
        {REACTIONS.map((emoji) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={t('reactA11y', { emoji })}
            onPress={() => onReaction(emoji)}
            style={({ pressed }) => [styles.reactBtn, pressed && styles.pressed]}
          >
            <Text style={styles.reactEmoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.inputBar}>
        <View style={styles.field}>
          <MessageCircle size={17} color={LIVE.textFaint} strokeWidth={1.75} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('commentPlaceholder')}
            placeholderTextColor={LIVE.textFaint}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={submit}
            editable={connected}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={handRaised ? t('lowerHand') : t('raiseHand')}
          onPress={handRaised ? onLowerHand : onRaiseHand}
          style={({ pressed }) => [styles.iconBtn, handRaised && styles.iconBtnOn, pressed && styles.pressed]}
        >
          {handRaised ? (
            <LinearGradient
              colors={[LIVE.goldLt, LIVE.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Hand size={20} color={handRaised ? LIVE.inkPin : '#FFFFFF'} strokeWidth={1.75} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sendComment')}
          onPress={submit}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Send size={20} color="#FFFFFF" strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      gap: 12,
    },
    reactBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    reactBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    reactEmoji: {
      fontSize: 20,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    field: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 15,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    input: {
      flex: 1,
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '500',
      color: '#FFFFFF',
      padding: 0,
    },
    iconBtn: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    iconBtnOn: {
      borderColor: 'transparent',
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
  });
}
