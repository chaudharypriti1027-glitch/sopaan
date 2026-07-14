import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { AiAvatar } from './AiAvatar';
import { AI_UI, aiPressFeedback } from './aiTheme';

type AiHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  backA11y: string;
  evaluateLabel: string;
  onBack?: () => void;
  onEvaluatePress?: () => void;
};

export function AiHeader({
  title,
  subtitle,
  eyebrow,
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
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backA11y}
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && aiPressFeedback]}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <View style={styles.center}>
          <AiAvatar size={40} variant="hero" />
          <View style={styles.copy}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        {onEvaluatePress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onEvaluatePress}
            style={({ pressed }) => [styles.evaluateBtn, pressed && aiPressFeedback]}
          >
            <Sparkles size={12} color={AI_UI.gold} strokeWidth={2.4} />
            <Text style={styles.evaluateText}>{evaluateLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    header: {
      paddingTop: topInset + 10,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 34,
      overflow: 'hidden',
    },
    decorA: {
      position: 'absolute',
      top: -50,
      right: -30,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(194,154,78,0.2)',
    },
    decorB: {
      position: 'absolute',
      bottom: -30,
      left: -20,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      zIndex: 2,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    backSpacer: {
      width: 38,
      height: 38,
    },
    center: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 4,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.68)',
    },
    title: {
      fontSize: 18,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.72)',
    },
    evaluateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.35)',
      marginTop: 4,
      maxWidth: 108,
    },
    evaluateText: {
      flexShrink: 1,
      fontSize: 10.5,
      lineHeight: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.goldSoft,
    },
  });
}
