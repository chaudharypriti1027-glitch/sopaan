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
  const styles = useMemo(() => createStyles(insets), [insets]);

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
      <View style={[styles.decoGold]} pointerEvents="none" />
      <View style={[styles.decoSage]} pointerEvents="none" />

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

function createStyles(insets: { top: number; bottom: number; left: number; right: number }) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_UI.bg,
    },
    decoGold: {
      position: 'absolute',
      top: -70,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: AUTH_UI.goldSoft,
    },
    decoSage: {
      position: 'absolute',
      bottom: 120,
      left: -70,
      width: 200,
      height: 200,
      borderRadius: 100,
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
      paddingHorizontal: 24 + insets.left,
      paddingRight: 24 + insets.right,
    },
    staticContent: {
      flex: 1,
      justifyContent: 'center',
    },
    card: {
      zIndex: 2,
    },
    body: {
      gap: 0,
    },
    footer: {
      marginTop: 20,
      gap: 10,
    },
  });
}
