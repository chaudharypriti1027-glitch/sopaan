import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PREMIUM } from './premium/premiumStyles';
import { useTheme } from '../theme';

type BottomInset = 'tab' | 'stack' | 'none';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Extra bottom space for floating tab bar on tab-root screens. */
  bottomInset?: BottomInset;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style' | 'children'>;
};

function bottomPadding(inset: BottomInset, safeBottom: number) {
  if (inset === 'tab') {
    return PREMIUM.tabBottomPadding;
  }
  if (inset === 'stack') {
    return PREMIUM.stackBottomPadding + safeBottom;
  }
  return safeBottom;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  bottomInset = 'stack',
  style,
  contentContainerStyle,
  scrollProps,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, insets, padded, bottomInset),
    [theme, insets, padded, bottomInset],
  );

  if (scroll) {
    return (
      <ScrollView
        style={[styles.screen, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.screen, styles.content, style, contentContainerStyle]}>{children}</View>;
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  insets: { top: number; bottom: number; left: number; right: number },
  padded: boolean,
  bottomInset: BottomInset,
) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: PREMIUM.bg,
    },
    content: {
      flexGrow: 1,
      paddingTop: insets.top,
      paddingBottom: bottomPadding(bottomInset, insets.bottom),
      paddingLeft: padded ? theme.spacing.lg + insets.left : insets.left,
      paddingRight: padded ? theme.spacing.lg + insets.right : insets.right,
    },
  });
}
