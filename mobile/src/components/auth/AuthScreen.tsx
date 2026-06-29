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

/** Auth flow shell — premium card on soft canvas. */
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 16,
      paddingHorizontal: 16 + insets.left,
      paddingRight: 16 + insets.right,
    },
    staticContent: {
      flex: 1,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: AUTH_UI.card,
      borderRadius: AUTH_UI.cardRadius,
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.8)',
      padding: 32,
      shadowColor: AUTH_UI.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 48,
      elevation: 8,
    },
    body: {
      gap: 0,
    },
    footer: {
      marginTop: 4,
      gap: 10,
    },
  });
}
