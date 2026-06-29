import { useMemo } from 'react';
import { StyleSheet, View, type TextProps, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type SectionTitleProps = TextProps & {
  title: string;
  subtitle?: string;
  containerStyle?: ViewStyle;
};

export function SectionTitle({ title, subtitle, containerStyle, style, ...rest }: SectionTitleProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, style]} {...rest}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      gap: 4,
    },
    title: {
      fontSize: 15,
      lineHeight: 19,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      lineHeight: 16,
    },
  });
}
