import { useMemo } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '../theme';

type EyebrowProps = TextProps & {
  children: string;
  color?: string;
};

export function Eyebrow({ children, color, style, ...rest }: EyebrowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, color), [theme, color]);

  return (
    <Text style={[styles.text, style]} {...rest}>
      {children.toUpperCase()}
    </Text>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], color?: string) {
  return StyleSheet.create({
    text: {
      ...theme.typography.presets.eyebrow,
      color: color ?? theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
  });
}
