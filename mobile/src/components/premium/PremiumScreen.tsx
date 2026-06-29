import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { PREMIUM } from './premiumStyles';

type BottomInset = 'tab' | 'stack' | 'none';

type PremiumScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bottomInset?: BottomInset;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style' | 'children'>;
};

function resolveBottomPadding(inset: BottomInset, safeBottom: number) {
  if (inset === 'tab') {
    return PREMIUM.tabBottomPadding;
  }
  if (inset === 'stack') {
    return PREMIUM.stackBottomPadding + safeBottom;
  }
  return safeBottom;
}

/**
 * Premium v2 screen shell — canvas bg, safe areas, tab-bar clearance.
 * Use on tab roots and custom-layout screens (Home/Profile pattern).
 */
export function PremiumScreen({
  children,
  scroll = false,
  padded = true,
  bottomInset = 'stack',
  style,
  contentContainerStyle,
  scrollProps,
}: PremiumScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, padded, bottomInset),
    [theme, padded, bottomInset],
  );

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={['left', 'right', 'bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['left', 'right', 'bottom']}>
      <View style={[styles.contentFill, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  padded: boolean,
  bottomInset: BottomInset,
) {
  const horizontal = padded ? theme.spacing.lg : 0;

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PREMIUM.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: horizontal,
      paddingBottom: resolveBottomPadding(bottomInset, 0),
    },
    contentFill: {
      flex: 1,
      paddingHorizontal: horizontal,
    },
  });
}
