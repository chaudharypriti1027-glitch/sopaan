import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { MENU_TONE_STYLES } from './premiumIconTokens';
import { PREMIUM } from './premiumStyles';

type MenuTone = keyof typeof MENU_TONE_STYLES;

type PremiumListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: LucideIcon;
  tone?: MenuTone;
  onPress?: () => void;
  trailing?: ReactNode;
  unread?: boolean;
  showChevron?: boolean;
  bordered?: boolean;
  last?: boolean;
  testID?: string;
};

/** Standard list row — icon tile, title stack, trailing action. */
export function PremiumListRow({
  title,
  subtitle,
  meta,
  icon: Icon,
  tone = 'indigo',
  onPress,
  trailing,
  unread = false,
  showChevron = Boolean(onPress && !trailing),
  bordered = true,
  last = false,
  testID,
}: PremiumListRowProps) {
  const { theme } = useTheme();
  const palette = MENU_TONE_STYLES[tone];
  const styles = useMemo(() => createStyles(theme), [theme]);

  const body = (
    <>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
          <Icon size={18} color={palette.fg} strokeWidth={1.9} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          {unread ? <View style={styles.unreadDot} /> : null}
          <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={2}>
            {title}
          </Text>
        </View>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ?? (showChevron ? <ChevronRight size={18} color={theme.colors.text.tertiary} /> : null)}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[styles.row, bordered && !last && styles.rowBorder]}
        testID={testID}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        bordered && !last && styles.rowBorder,
        pressed && styles.pressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.subtle,
    },
    pressed: {
      backgroundColor: theme.colors.surface.muted,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: PREMIUM.gold,
    },
    title: {
      flex: 1,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PREMIUM.ink,
    },
    titleUnread: {
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
    },
    subtitle: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.text.secondary,
    },
    meta: {
      fontSize: 11,
      lineHeight: 14,
      color: PREMIUM.sectionLabel,
      marginTop: 1,
    },
  });
}
