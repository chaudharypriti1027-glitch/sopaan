import { useMemo } from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import type { TextVariant } from './Text';

export type NumTextProps = RNTextProps & {
  variant?: TextVariant | 'stat' | 'statLarge';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse';
};

const colorKey: Record<NonNullable<NumTextProps['color']>, keyof ReturnType<typeof useTheme>['theme']['colors']['text']> = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  inverse: 'inverse',
};

/** Numbers, ranks, stats — Space Grotesk with tabular figures. */
export function NumText({
  variant = 'stat',
  color = 'primary',
  style,
  maxFontSizeMultiplier,
  ...rest
}: NumTextProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, variant, color),
    [theme, variant, color],
  );

  return (
    <RNText
      style={[styles.text, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? theme.a11y.maxFontSizeMultiplierDense}
      {...rest}
    />
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  variant: NonNullable<NumTextProps['variant']>,
  color: NonNullable<NumTextProps['color']>,
) {
  const preset =
    variant === 'stat' || variant === 'statLarge'
      ? theme.typography.presets[variant]
      : theme.typography.presets[variant];

  return {
    text: {
      ...preset,
      fontFamily: theme.typography.fonts.stat.semibold,
      fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
      color: theme.colors.text[colorKey[color]],
    } satisfies TextStyle,
  };
}
