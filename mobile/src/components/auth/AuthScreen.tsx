import { useMemo, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../../layout/responsive';
import { AUTH_UI } from './authTheme';

type AuthScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style' | 'children'>;
};

/** Auth flow shell — "Classic Premium" cream canvas with soft brand decor. */
export function AuthScreen({
  children,
  footer,
  header,
  scroll = true,
  contentStyle,
  scrollProps,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { isWeb, contentPadding, isWideWeb } = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(insets, isWeb ? (contentPadding ?? 24) : 24, isWideWeb),
    [insets, isWeb, contentPadding, isWideWeb],
  );

  const card = (
    <View style={styles.card}>
      {header}
      <View style={[styles.body, contentStyle]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={[styles.decoGold, styles.pointerNone]} />
      <View style={[styles.decoSage, styles.pointerNone]} />

      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {card}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, styles.staticContent]}>{card}</View>
      )}
    </KeyboardAvoidingView>
  );
}

function createStyles(
  insets: { top: number; bottom: number; left: number; right: number },
  horizontalPad: number,
  wideWeb: boolean,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_UI.bg,
    },
    decoGold: {
      position: 'absolute',
      top: -70,
      right: wideWeb ? '10%' : -60,
      width: wideWeb ? 280 : 220,
      height: wideWeb ? 280 : 220,
      borderRadius: 140,
      backgroundColor: AUTH_UI.goldSoft,
    },
    decoSage: {
      position: 'absolute',
      bottom: 120,
      left: wideWeb ? '8%' : -70,
      width: wideWeb ? 240 : 200,
      height: wideWeb ? 240 : 200,
      borderRadius: 120,
      backgroundColor: AUTH_UI.sageSoft,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: insets.top + 24,
      paddingBottom: insets.bottom + 24,
      paddingLeft: horizontalPad + insets.left,
      paddingRight: horizontalPad + insets.right,
      width: '100%',
      maxWidth: wideWeb ? 480 : '100%',
      alignSelf: 'center',
    },
    staticContent: {
      flex: 1,
      justifyContent: 'center',
    },
    card: {
      zIndex: 2,
      width: '100%',
      maxWidth: wideWeb ? 440 : undefined,
      alignSelf: 'center',
    },
    body: {
      gap: 0,
    },
    footer: {
      marginTop: 20,
      gap: 10,
    },
    pointerNone: {
      pointerEvents: 'none',
    },
  });
}
