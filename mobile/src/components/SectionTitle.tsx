import { useMemo } from 'react';
import { StyleSheet, View, type TextProps, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { PREMIUM } from './premium/premiumStyles';
import { Text } from './Text';

type SectionTitleVariant = 'auto' | 'intro' | 'section';

type SectionTitleProps = TextProps & {
  title?: string;
  subtitle?: string;
  variant?: SectionTitleVariant;
  containerStyle?: ViewStyle;
};

function resolveVariant(
  variant: SectionTitleVariant,
  title?: string,
  subtitle?: string,
): 'intro' | 'section' {
  if (variant !== 'auto') return variant;
  if (subtitle && !title) return 'intro';
  if (title && !subtitle) return 'section';
  return 'intro';
}

export function SectionTitle({
  title,
  subtitle,
  variant = 'auto',
  containerStyle,
  style,
  ...rest
}: SectionTitleProps) {
  const { theme } = useTheme();
  const resolved = resolveVariant(variant, title, subtitle);
  const styles = useMemo(() => createStyles(theme, resolved), [theme, resolved]);

  if (resolved === 'section') {
    if (!title) return null;
    return (
      <View style={[styles.sectionWrap, containerStyle]}>
        <View style={styles.sectionAccent} />
        <Text style={[styles.sectionLabel, style]} {...rest}>
          {title}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.introWrap, containerStyle]}>
      {title ? (
        <Text style={[styles.introTitle, style]} {...rest}>
          {title}
        </Text>
      ) : null}
      {subtitle ? <Text style={styles.introSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  resolved: 'intro' | 'section',
) {
  return StyleSheet.create({
    sectionWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: resolved === 'section' ? 4 : 0,
      marginBottom: 10,
      marginHorizontal: 2,
    },
    sectionAccent: {
      width: 3,
      height: 14,
      borderRadius: 2,
      backgroundColor: PREMIUM.gold,
    },
    sectionLabel: {
      flex: 1,
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
      color: PREMIUM.sectionLabel,
    },
    introWrap: {
      gap: 6,
      marginBottom: 4,
    },
    introTitle: {
      fontSize: 22,
      lineHeight: 26,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.45,
      color: PREMIUM.ink,
    },
    introSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      lineHeight: 18,
    },
  });
}
