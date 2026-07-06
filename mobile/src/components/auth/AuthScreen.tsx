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
import { LinearGradient } from 'expo-linear-gradient';
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
    <LinearGradient
      colors={[AUTH_UI.bgTop, AUTH_UI.bg, AUTH_UI.bgBottom]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.root}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={[styles.decoGold, styles.pointerNone]} />
        <View style={[styles.decoSage, styles.pointerNone]} />
        <View style={[styles.decoNavy, styles.pointerNone]} />

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
    </LinearGradient>
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
    },
    flex: {
      flex: 1,
    },
    decoGold: {
      position: 'absolute',
      top: -90,
      right: wideWeb ? '8%' : -70,
      width: wideWeb ? 300 : 240,
      height: wideWeb ? 300 : 240,
      borderRadius: 150,
      backgroundColor: AUTH_UI.goldSoft,
      opacity: 0.9,
    },
    decoSage: {
      position: 'absolute',
      bottom: 100,
      left: wideWeb ? '6%' : -80,
      width: wideWeb ? 260 : 210,
      height: wideWeb ? 260 : 210,
      borderRadius: 130,
      backgroundColor: AUTH_UI.sageSoft,
      opacity: 0.85,
    },
    decoNavy: {
      position: 'absolute',
      top: '38%',
      left: -120,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: AUTH_UI.accentSoft,
      opacity: 0.35,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: insets.top + 20,
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
      marginTop: 18,
      gap: 8,
    },
    pointerNone: {
      pointerEvents: 'none',
    },
  });
}
