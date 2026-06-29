import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { PREMIUM } from './premiumStyles';

type PremiumPageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightAction?: ReactNode;
  /** Extra bottom padding when a card floats over the header. */
  floatCard?: boolean;
  /** When false, skip negative horizontal margin (use on full-bleed parents). */
  fullBleed?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PremiumPageHeader({
  title,
  subtitle,
  eyebrow,
  rightAction,
  floatCard = false,
  fullBleed = true,
  style,
}: PremiumPageHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top, floatCard, fullBleed),
    [theme, insets.top, floatCard, fullBleed],
  );

  return (
    <LinearGradient
      colors={[...PREMIUM.headerGradient]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.gradient, style]}
    >
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <View style={styles.topbar}>
        <View style={styles.titleWrap}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
      </View>
    </LinearGradient>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  topInset: number,
  floatCard: boolean,
  fullBleed: boolean,
) {
  return StyleSheet.create({
    gradient: {
      marginHorizontal: fullBleed ? -theme.spacing.lg : 0,
      paddingTop: topInset + 12,
      paddingHorizontal: theme.spacing.lg + 4,
      paddingBottom: floatCard ? 52 : 28,
      overflow: 'hidden',
    },
    decorA: {
      position: 'absolute',
      top: -50,
      right: -40,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorB: {
      position: 'absolute',
      bottom: -40,
      left: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(124,118,240,0.35)',
    },
    topbar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      zIndex: 2,
    },
    titleWrap: {
      flex: 1,
      gap: 4,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.72)',
    },
    title: {
      fontSize: 24,
      lineHeight: 28,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: '#FFFFFF',
    },
    subtitle: {
      marginTop: 2,
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.82)',
      lineHeight: 18,
    },
    right: {
      zIndex: 2,
    },
  });
}
