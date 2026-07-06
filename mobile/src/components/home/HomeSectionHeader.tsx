import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { PremiumIconTone } from '../premium/premiumIconTokens';
import { HomeSectionIcon, HomeSlotIcon } from './HomePremiumIcon';
import { HOME_UI, home3dBevel, homePressFeedback } from './homeTheme';

type HomeSectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  badge?: ReactNode;
  sectionIcon?: { Icon: LucideIcon; tone: PremiumIconTone };
  /** Tighter top spacing directly under the hero card. */
  compact?: boolean;
};

export function HomeSectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  badge,
  sectionIcon,
  compact = false,
}: HomeSectionHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  return (
    <View style={styles.row}>
      <View style={styles.titleCol}>
        <View style={styles.titleWrap}>
          {sectionIcon ? (
            <HomeSectionIcon Icon={sectionIcon.Icon} tone={sectionIcon.tone} />
          ) : (
            <GoldAccent />
          )}
          <View style={styles.titleTextCol}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>
      <View style={styles.trailing}>
        {badge}
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={onActionPress}
            disabled={!onActionPress}
            hitSlop={8}
            style={({ pressed }) => [styles.actionBtn, pressed && onActionPress && styles.pressed]}
          >
            <Text style={[styles.action, !onActionPress && styles.actionMuted]}>{actionLabel}</Text>
            {onActionPress ? (
              <HomeSlotIcon slot="button" Icon={ChevronRight} tone="gold" />
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function GoldAccent() {
  return (
    <View style={accentStyles.wrap}>
      <View style={accentStyles.bar} />
      <View style={accentStyles.glow} />
    </View>
  );
}

const accentStyles = StyleSheet.create({
  wrap: {
    width: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: HOME_UI.gold,
  },
  glow: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HOME_UI.goldSoft,
    opacity: 0.8,
  },
});

function createStyles(theme: ReturnType<typeof useTheme>['theme'], compact: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14,
      marginTop: compact ? 0 : 4,
      paddingHorizontal: 2,
      gap: theme.spacing.sm,
    },
    titleCol: {
      flex: 1,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    titleTextCol: {
      flex: 1,
      gap: 2,
      paddingTop: 1,
    },
    title: {
      fontSize: 18,
      lineHeight: 23,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: HOME_UI.ink,
    },
    subtitle: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
      paddingTop: 2,
    },
    action: {
      fontSize: 12.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.accent,
    },
    actionMuted: {
      opacity: 0.55,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 10,
      backgroundColor: HOME_UI.surface,
      borderWidth: 1,
      borderColor: HOME_UI.border,
      ...home3dBevel,
    },
    pressed: homePressFeedback,
  });
}
