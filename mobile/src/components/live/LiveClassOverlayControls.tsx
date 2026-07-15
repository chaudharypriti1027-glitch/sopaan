import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Hand, MessageCircle, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LIVE_REACTIONS } from '../../content/liveClassesContent';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';

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
      <View style={styles.reactBar} testID="live-reaction-bar">
        {LIVE_REACTIONS.map(({ emoji, Icon, labelKey }) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={t('reactA11y', { reaction: t(`reactions.${labelKey}`) })}
            onPress={() => onReaction(emoji)}
            style={({ pressed }) => [styles.reactBtn, pressed && styles.pressed]}
            testID={`live-reaction-${emoji}`}
          >
            <Icon size={19} color={LIVE.goldLt} strokeWidth={2.15} />
          </Pressable>
        ))}
      </View>

      <View style={styles.inputBar}>
        <View style={styles.field}>
          <MessageCircle size={16} color={LIVE.textFaint} strokeWidth={1.85} />
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
          <Hand size={19} color={handRaised ? LIVE.inkPin : '#FFFFFF'} strokeWidth={1.85} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sendComment')}
          onPress={submit}
          style={({ pressed }) => [
            styles.iconBtn,
            styles.sendBtn,
            !connected && styles.iconBtnDisabled,
            pressed && styles.pressed,
          ]}
          disabled={!connected}
        >
          <Send size={18} color={LIVE.inkPin} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      gap: 11,
    },
    reactBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 4,
      paddingHorizontal: 6,
      alignSelf: 'center',
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.22)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    reactBtn: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: 'rgba(201,162,75,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(233,207,141,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
      paddingHorizontal: 13,
      paddingVertical: 11,
      minHeight: 46,
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
    sendBtn: {
      backgroundColor: LIVE.goldLt,
      borderColor: 'transparent',
    },
    iconBtnOn: {
      borderColor: 'transparent',
    },
    iconBtnDisabled: {
      opacity: 0.55,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
  });
}
