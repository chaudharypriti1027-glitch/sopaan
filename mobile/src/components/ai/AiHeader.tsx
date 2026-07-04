import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { Text } from '../Text';
import { GlassSurface } from '../GlassSurface';
import { useTheme } from '../../theme';
import { AiAvatar } from './AiAvatar';
import { AI_UI } from './aiTheme';

type AiHeaderProps = {
  title: string;
  badgeLabel: string;
  onBack?: () => void;
  onBadgePress?: () => void;
};

export function AiHeader({ title, badgeLabel, onBack, onBadgePress }: AiHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  return (
    <GlassSurface tone="light" intensity={46} borderRadius={0} bordered={false} style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <ArrowLeft size={18} color={AI_UI.primary} strokeWidth={2.5} />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}

      <View style={styles.center}>
        <AiAvatar size={32} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onBadgePress}
        style={({ pressed }) => [styles.badge, pressed && styles.pressed]}
      >
        <Sparkles size={11} color={AI_UI.primary} strokeWidth={2.5} />
        <Text style={styles.badgeText}>{badgeLabel}</Text>
      </Pressable>
    </GlassSurface>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], topInset: number) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset + 8,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(79,53,210,0.09)',
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 16,
      backgroundColor: AI_UI.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backSpacer: {
      width: 36,
      height: 36,
    },
    center: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      paddingHorizontal: theme.spacing.sm,
    },
    title: {
      fontSize: 15,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: AI_UI.ink,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: AI_UI.primaryLight,
      borderWidth: 1.5,
      borderColor: 'rgba(184,179,224,0.33)',
    },
    badgeText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: AI_UI.primary,
    },
    pressed: {
      opacity: 0.88,
    },
  });
}
