import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ImagePlus, Send } from 'lucide-react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { useTheme } from '../../theme';
import { AI_UI, aiPremiumCard, aiPressFeedback } from './aiTheme';

type AiComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCamera: () => void;
  onGallery: () => void;
  placeholder: string;
  disabled?: boolean;
  cameraA11y: string;
  galleryA11y: string;
  sendA11y: string;
};

export function AiComposer({
  value,
  onChangeText,
  onSend,
  onCamera,
  onGallery,
  placeholder,
  disabled,
  cameraA11y,
  galleryA11y,
  sendA11y,
}: AiComposerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={styles.tools}>
          <IconBtn onPress={onCamera} accessibilityLabel={cameraA11y}>
            <Camera size={18} color={AI_UI.primary} strokeWidth={2} />
          </IconBtn>
          <IconBtn onPress={onGallery} accessibilityLabel={galleryA11y}>
            <ImagePlus size={18} color={AI_UI.primary} strokeWidth={2} />
          </IconBtn>
        </View>

        <TextInput
          testID="ask-ai-input"
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={AI_UI.sub}
          accessibilityLabel={placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={2000}
          editable={!disabled}
          {...scalableTextProps}
        />

        <Pressable
          testID="ask-ai-send"
          accessibilityRole="button"
          accessibilityLabel={sendA11y}
          onPress={canSend ? onSend : undefined}
          disabled={!canSend}
          style={({ pressed }) => [pressed && canSend && aiPressFeedback]}
        >
          <LinearGradient
            colors={canSend ? [AI_UI.primary, AI_UI.gradientEnd] : [AI_UI.primaryLight, AI_UI.primaryLight]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            <Send size={16} color={canSend ? '#FFFFFF' : AI_UI.sub} strokeWidth={2.3} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function IconBtn({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [iconStyles.btn, pressed && iconStyles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const iconStyles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AI_UI.goldSoft,
    borderWidth: 1,
    borderColor: AI_UI.goldBorder,
  },
  pressed: {
    opacity: 0.9,
  },
});

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.lg,
    },
    bar: {
      ...aiPremiumCard(),
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderColor: AI_UI.goldBorder,
    },
    tools: {
      flexDirection: 'row',
      gap: 6,
      paddingBottom: 2,
    },
    input: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.ui.regular,
      color: AI_UI.ink,
      maxHeight: 110,
      paddingVertical: 8,
      paddingHorizontal: 4,
      minHeight: 40,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 4,
    },
    sendBtnDisabled: {
      shadowOpacity: 0,
      elevation: 0,
    },
  });
}
