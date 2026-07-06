import { useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HOME_UI, home3dBevel, homePressFeedback } from './homeTheme';

type HomePremiumButtonVariant = 'gold' | 'navy' | 'ghost' | 'outline';
type HomePremiumButtonSize = 'sm' | 'md';

type HomePremiumButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: HomePremiumButtonVariant;
  size?: HomePremiumButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  trailingIcon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function HomePremiumButton({
  label,
  onPress,
  variant = 'navy',
  size = 'md',
  fullWidth = false,
  disabled = false,
  trailingIcon,
  style,
  testID,
}: HomePremiumButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, size, fullWidth), [theme, size, fullWidth]);

  const content = (
    <>
      <Text
        style={[
          styles.label,
          variant === 'gold' && styles.labelGold,
          variant === 'ghost' && styles.labelGhost,
          variant === 'outline' && styles.labelOutline,
        ]}
      >
        {label}
      </Text>
      {trailingIcon ? (
        <HomeSlotIcon
          slot="button"
          Icon={trailingIcon}
          tone={variant === 'gold' ? 'lavender' : variant === 'navy' ? 'gold' : 'slate'}
        />
      ) : null}
    </>
  );

  if (variant === 'gold') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled || !onPress}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [styles.shell, pressed && onPress && homePressFeedback, style]}
      >
        <LinearGradient
          colors={['#F0D48A', '#C29A4E', '#A67C33']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.goldFill}
        >
          <View style={styles.goldSheen} />
          <View style={styles.row}>{content}</View>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'navy') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled || !onPress}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [styles.shell, pressed && onPress && homePressFeedback, style]}
      >
        <LinearGradient
          colors={[...HOME_UI.accentGradient]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.navyFill}
        >
          <View style={styles.navySheen} />
          <View style={styles.row}>{content}</View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || !onPress}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.shell,
        variant === 'outline' ? styles.outline : styles.ghost,
        pressed && onPress && homePressFeedback,
        style,
      ]}
    >
      <View style={styles.row}>{content}</View>
    </Pressable>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  size: HomePremiumButtonSize,
  fullWidth: boolean,
) {
  const padV = size === 'sm' ? 9 : 12;
  const padH = size === 'sm' ? 12 : 16;
  const fontSize = size === 'sm' ? 12 : 13;

  return StyleSheet.create({
    shell: {
      borderRadius: HOME_UI.innerRadius,
      overflow: 'hidden',
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      width: fullWidth ? '100%' : undefined,
      ...platformShadow({
        color: HOME_UI.shadow,
        offsetY: 5,
        opacity: 0.14,
        radius: 10,
        elevation: 3,
      }),
    },
    goldFill: {
      paddingVertical: padV,
      paddingHorizontal: padH,
      borderRadius: HOME_UI.innerRadius,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      overflow: 'hidden',
    },
    goldSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '42%',
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    navyFill: {
      paddingVertical: padV,
      paddingHorizontal: padH,
      borderRadius: HOME_UI.innerRadius,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      overflow: 'hidden',
    },
    navySheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '40%',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    outline: {
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      ...home3dBevel,
      paddingVertical: padV,
      paddingHorizontal: padH,
      borderRadius: HOME_UI.innerRadius,
    },
    ghost: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      paddingVertical: padV,
      paddingHorizontal: padH,
      borderRadius: HOME_UI.innerRadius,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      zIndex: 1,
    },
    label: {
      fontSize,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    labelGold: {
      color: HOME_UI.accent,
    },
    labelGhost: {
      color: 'rgba(255,255,255,0.9)',
    },
    labelOutline: {
      color: HOME_UI.accent,
    },
  });
}
