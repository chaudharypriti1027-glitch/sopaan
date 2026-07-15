import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { HomeSectionIcon } from './HomePremiumIcon';
import type { HomeSectionIconSpec } from './homeIcons';
import { HOME_UI, homePressFeedback } from './homeTheme';

type HomeSectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  badge?: ReactNode;
  compact?: boolean;
  icon?: HomeSectionIconSpec;
};

export function HomeSectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  badge,
  compact = false,
  icon,
}: HomeSectionHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  return (
    <View style={styles.row}>
      <View style={styles.titleCol}>
        <View style={styles.titleWrap}>
          {icon ? (
            <HomeSectionIcon Icon={icon.Icon} tone={icon.tone} style={styles.sectionIcon} />
          ) : (
            <View style={styles.accent} />
          )}
          <View style={styles.titleTextCol}>
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
            <Text style={[styles.action, !onActionPress && styles.actionMuted]} numberOfLines={1}>
              {actionLabel}
            </Text>
            {onActionPress ? <ChevronRight size={14} color={HOME_UI.goldDeep} strokeWidth={2.5} /> : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], compact: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      marginTop: compact ? 0 : 2,
      gap: theme.spacing.sm,
    },
    titleCol: {
      flex: 1,
      minWidth: 0,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    accent: {
      width: 3,
      height: 18,
      borderRadius: 2,
      backgroundColor: HOME_UI.gold,
    },
    sectionIcon: {
      marginTop: 0,
    },
    titleTextCol: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    title: {
      fontSize: 18,
      lineHeight: 22,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: HOME_UI.ink,
    },
    subtitle: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: theme.typography.fonts.ui.medium,
      fontWeight: '500',
      color: HOME_UI.muted,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    action: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: HOME_UI.goldDeep,
    },
    actionMuted: {
      opacity: 0.55,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
      paddingVertical: 2,
      paddingLeft: 4,
    },
    pressed: homePressFeedback,
  });
}
