import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ImagePlus, Mic, Send } from 'lucide-react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { GlassSurface } from '../GlassSurface';
import { useTheme } from '../../theme';
import { AI_UI } from './aiTheme';

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
      <View style={styles.shadowWrap}>
        <GlassSurface tone="light" intensity={50} borderRadius={16} style={styles.bar}>
          <IconBtn onPress={onCamera} accessibilityLabel={cameraA11y}>
            <Camera size={18} color={AI_UI.primaryMuted} strokeWidth={1.8} />
          </IconBtn>
          <IconBtn onPress={onGallery} accessibilityLabel={galleryA11y}>
            <ImagePlus size={18} color={AI_UI.primaryMuted} strokeWidth={1.8} />
          </IconBtn>

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

          {canSend ? (
            <Pressable
              testID="ask-ai-send"
              accessibilityRole="button"
              accessibilityLabel={sendA11y}
              onPress={onSend}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <LinearGradient
                colors={[AI_UI.primary, AI_UI.gradientEnd]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.sendBtn}
              >
                <Send size={15} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.micBtn}>
              <Mic size={18} color={AI_UI.primaryMuted} strokeWidth={1.8} />
            </View>
          )}
        </GlassSurface>
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
  },
  pressed: {
    backgroundColor: AI_UI.primaryLight,
  },
});

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
      backgroundColor: 'transparent',
    },
    shadowWrap: {
      borderRadius: 16,
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 4,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    input: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 19,
      fontFamily: theme.typography.fonts.ui.regular,
      color: AI_UI.ink,
      maxHeight: 100,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: AI_UI.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.31,
      shadowRadius: 14,
      elevation: 3,
    },
    micBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.9,
    },
  });
}
