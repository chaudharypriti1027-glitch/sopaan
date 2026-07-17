import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, PenLine } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AiAvatar } from './AiAvatar';
import { AI_UI, aiPressFeedback } from './aiTheme';

type AiHeaderProps = {
  title: string;
  subtitle?: string;
  backA11y: string;
  evaluateLabel?: string;
  onBack?: () => void;
  onEvaluatePress?: () => void;
};

export function AiHeader({
  title,
  subtitle,
  backA11y,
  evaluateLabel,
  onBack,
  onEvaluatePress,
}: AiHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  return (
    <LinearGradient
      colors={[...AI_UI.headerGradient]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.header}
    >
      <View style={styles.decor} />

      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backA11y}
            onPress={onBack}
            style={({ pressed }) => [styles.iconBtn, pressed && aiPressFeedback]}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        ) : (
          <View style={styles.iconBtnSpacer} />
        )}

        <View style={styles.center}>
          <AiAvatar size={36} variant="hero" />
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {onEvaluatePress && evaluateLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={evaluateLabel}
            onPress={onEvaluatePress}
            style={({ pressed }) => [styles.iconBtn, styles.evalBtn, pressed && aiPressFeedback]}
          >
            <PenLine size={16} color={AI_UI.gold} strokeWidth={2.3} />
          </Pressable>
        ) : (
          <View style={styles.iconBtnSpacer} />
        )}
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    header: {
      paddingTop: topInset + 8,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 28,
      overflow: 'hidden',
    },
    decor: {
      position: 'absolute',
      top: -40,
      right: -24,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(194,154,78,0.16)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      zIndex: 2,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    evalBtn: {
      borderColor: 'rgba(194,154,78,0.4)',
      backgroundColor: 'rgba(194,154,78,0.14)',
    },
    iconBtnSpacer: {
      width: 40,
      height: 40,
    },
    center: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minWidth: 0,
    },
    copy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.7)',
    },
  });
}
