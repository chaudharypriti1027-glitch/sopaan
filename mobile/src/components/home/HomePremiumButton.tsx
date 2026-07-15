import { useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { denseTextProps } from '../../a11y/textProps';
import { platformShadow } from '../../utils/platformShadow';
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
  /** Visual-only (no nested Pressable) — use inside a parent Pressable. */
  inert?: boolean;
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
  trailingIcon: TrailingIcon,
  inert = false,
  style,
  testID,
}: HomePremiumButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, size, fullWidth), [theme, size, fullWidth]);
  const glyphSize = size === 'sm' ? 14 : 15;
  const trailingColor =
    variant === 'gold' || variant === 'outline' ? HOME_UI.accent : '#FFFFFF';

  const labelNode = (
    <Text
      {...denseTextProps}
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[
        styles.label,
        variant === 'gold' && styles.labelGold,
        variant === 'ghost' && styles.labelGhost,
        variant === 'outline' && styles.labelOutline,
      ]}
    >
      {label}
    </Text>
  );

  const trailing =
    TrailingIcon != null ? (
      <TrailingIcon size={glyphSize} color={trailingColor} strokeWidth={2.4} />
    ) : null;

  const content = (
    <View style={styles.row}>
      {labelNode}
      {trailing}
    </View>
  );

  const shellStyle = [
    styles.shell,
    variant === 'navy' && styles.navyPill,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    style,
  ];

  if (inert || !onPress) {
    if (variant === 'gold') {
      return (
        <View style={shellStyle} testID={testID} pointerEvents="none">
          <LinearGradient
            colors={['#F0D48A', '#C29A4E', '#A67C33']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.fill}
          >
            <View style={styles.goldSheen} />
            {content}
          </LinearGradient>
        </View>
      );
    }
    return (
      <View style={shellStyle} testID={testID} pointerEvents="none">
        {content}
      </View>
    );
  }

  if (variant === 'gold') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [styles.shell, pressed && homePressFeedback, style]}
      >
        <LinearGradient
          colors={['#F0D48A', '#C29A4E', '#A67C33']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.fill}
        >
          <View style={styles.goldSheen} />
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.shell,
        variant === 'navy' && styles.navyPill,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        pressed && homePressFeedback,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  size: HomePremiumButtonSize,
  fullWidth: boolean,
) {
  const minHeight = size === 'sm' ? 34 : 42;
  const padH = size === 'sm' ? 12 : 16;
  const fontSize = size === 'sm' ? 12 : 13;

  return StyleSheet.create({
    shell: {
      borderRadius: 99,
      overflow: 'hidden',
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      width: fullWidth ? '100%' : undefined,
      minHeight,
      flexShrink: 0,
      ...platformShadow({
        color: HOME_UI.shadow,
        offsetY: 4,
        opacity: 0.12,
        radius: 8,
        elevation: 3,
      }),
    },
    navyPill: {
      backgroundColor: HOME_UI.accent,
      minHeight: size === 'sm' ? 36 : 42,
      justifyContent: 'center',
      paddingHorizontal: padH,
    },
    fill: {
      flex: 1,
      minHeight,
      paddingHorizontal: padH,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      overflow: 'hidden',
      justifyContent: 'center',
    },
    goldSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '42%',
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    outline: {
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      ...home3dBevel,
      minHeight,
      paddingHorizontal: padH,
      borderRadius: 99,
      justifyContent: 'center',
    },
    ghost: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      minHeight,
      paddingHorizontal: padH,
      borderRadius: 99,
      justifyContent: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      zIndex: 1,
      minWidth: 0,
    },
    label: {
      flexShrink: 1,
      minWidth: 0,
      fontSize,
      lineHeight: fontSize + 3,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      includeFontPadding: false,
    },
    labelGold: {
      color: HOME_UI.accent,
    },
    labelGhost: {
      color: 'rgba(255,255,255,0.92)',
    },
    labelOutline: {
      color: HOME_UI.accent,
    },
  });
}
