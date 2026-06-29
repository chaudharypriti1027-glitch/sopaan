import { useMemo } from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import type { ThemeTypography } from '../theme/types';

export type TextVariant = keyof ThemeTypography['presets'];

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'link';
};

const colorKey: Record<NonNullable<TextProps['color']>, keyof ReturnType<typeof useTheme>['theme']['colors']['text']> = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  inverse: 'inverse',
  link: 'link',
};

/** Default body text — Plus Jakarta Sans. */
export function Text({
  variant = 'body',
  color = 'primary',
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, variant, color),
    [theme, variant, color],
  );

  return (
    <RNText
      style={[styles.text, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? theme.a11y.maxFontSizeMultiplier}
      {...rest}
    />
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  variant: TextVariant,
  color: NonNullable<TextProps['color']>,
) {
  return {
    text: {
      ...theme.typography.presets[variant],
      color: theme.colors.text[colorKey[color]],
    } satisfies TextStyle,
  };
}
