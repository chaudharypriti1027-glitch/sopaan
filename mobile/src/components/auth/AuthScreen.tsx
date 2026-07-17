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
import { AUTH_SPACING, AUTH_UI } from './authTheme';
import { AuthScreenAmbient } from './AuthScreenAmbient';

type AuthScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style' | 'children'>;
  /** Stretch content to fill the viewport (welcome / brand landing). */
  fill?: boolean;
  /** Hide the stair / glow ambient (rarely needed). */
  ambient?: boolean;
};

/** Auth flow shell — full-screen navy canvas with gold ambient decor. */
export function AuthScreen({
  children,
  footer,
  header,
  scroll = true,
  contentStyle,
  scrollProps,
  fill = false,
  ambient = true,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { isWeb, contentPadding, isWideWeb } = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(insets, isWeb ? (contentPadding ?? 24) : 24, isWideWeb, fill),
    [insets, isWeb, contentPadding, isWideWeb, fill],
  );

  const card = (
    <View style={[styles.card, fill && styles.cardFill]}>
      {header}
      <View style={[styles.body, fill && styles.bodyFill, contentStyle]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  return (
    <LinearGradient
      colors={[...AUTH_UI.canvasGradient]}
      locations={[0, 0.52, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.root}
    >
      {ambient ? <AuthScreenAmbient /> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, fill && styles.scrollFill]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            {...scrollProps}
          >
            {card}
          </ScrollView>
        ) : (
          <View style={[styles.scrollContent, styles.staticContent, fill && styles.scrollFill]}>
            {card}
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function createStyles(
  insets: { top: number; bottom: number; left: number; right: number },
  horizontalPad: number,
  wideWeb: boolean,
  fill: boolean,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    flex: {
      flex: 1,
      zIndex: 1,
    },
    scroll: {
      flex: 1,
      zIndex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: fill ? 'flex-start' : 'center',
      paddingTop: insets.top + (fill ? 12 : 20),
      paddingBottom: insets.bottom + (fill ? 20 : 24),
      paddingLeft: horizontalPad + insets.left,
      paddingRight: horizontalPad + insets.right,
      width: '100%',
      maxWidth: wideWeb ? 480 : '100%',
      alignSelf: 'center',
    },
    scrollFill: {
      minHeight: '100%',
    },
    staticContent: {
      flex: 1,
      justifyContent: fill ? 'flex-start' : 'center',
    },
    card: {
      zIndex: 2,
      width: '100%',
      maxWidth: wideWeb ? 440 : undefined,
      alignSelf: 'center',
      gap: AUTH_SPACING.section,
    },
    cardFill: {
      flex: 1,
      gap: 0,
      maxWidth: wideWeb ? 440 : undefined,
    },
    body: {
      gap: 0,
    },
    bodyFill: {
      flex: 1,
    },
    footer: {
      gap: AUTH_SPACING.footer,
    },
  });
}
