import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { HomeFeed } from '../../types/home';
import { homePremiumCard } from './homeStyles';

type CountdownPillProps = {
  countdown: HomeFeed['countdown'];
  /** Renders inside the hero card with a divider. */
  embedded?: boolean;
};

export function CountdownPill({ countdown, embedded = false }: CountdownPillProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, embedded), [theme, embedded]);

  if (!countdown) {
    return null;
  }

  const body = (
    <>
      <View style={styles.iconWrap}>
        <Calendar size={18} color={theme.colors.brand.primary} strokeWidth={1.8} />
      </View>
      <View style={styles.copy}>
        <NumText style={styles.days}>{countdown.daysLeft}</NumText>
        <Text style={styles.daysLabel}>days left</Text>
        <Text style={styles.exam} numberOfLines={1}>
          {countdown.examName}
        </Text>
      </View>
      {countdown.dateLabel ? (
        <Text style={styles.date}>{countdown.dateLabel}</Text>
      ) : null}
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{body}</View>;
  }

  return <View style={styles.standalone}>{body}</View>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], embedded: boolean) {
  return StyleSheet.create({
    standalone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...homePremiumCard(theme),
      padding: 14,
      marginTop: 12,
    },
    embedded: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.brand.primaryMuted,
      borderRadius: 14,
      padding: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: embedded ? theme.colors.surface.default : theme.colors.brand.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: 1,
    },
    days: {
      fontSize: 18,
      lineHeight: 20,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: theme.colors.brand.primary,
    },
    daysLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      marginTop: -2,
    },
    exam: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginTop: 2,
    },
    date: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.tertiary,
      alignSelf: 'flex-start',
    },
  });
}
