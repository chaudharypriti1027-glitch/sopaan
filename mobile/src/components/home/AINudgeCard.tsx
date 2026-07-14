import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { AINudge } from '../../types/home';
import { nudgeCardTint, nudgePremiumTone } from './homeIconTone';
import { HomeSlotIcon } from './HomePremiumIcon';
import { HomeFeedCard } from './HomeFeedCard';
import { resolveHomeIcon } from './homeIcons';
import { HOME_UI } from './homeTheme';

type AINudgeCardProps = {
  nudge: AINudge;
  onPress?: (deeplink: string) => void;
};

export function AINudgeSectionBadge() {
  const { theme } = useTheme();
  const styles = useMemo(() => createBadgeStyles(theme), [theme]);

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        <Text style={styles.spark}>✦ </Text>
        AI
      </Text>
    </View>
  );
}

export function AINudgeCard({ nudge, onPress }: AINudgeCardProps) {
  const { theme } = useTheme();
  const iconTone = nudgePremiumTone(nudge.tone);
  const tint = nudgeCardTint(nudge.tone);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const Icon = resolveHomeIcon(nudge.icon);

  return (
    <HomeFeedCard
      onPress={() => onPress?.(nudge.deeplink)}
      accentLeft={tint.accent}
      accentTop={nudge.tone === 'urgent' || nudge.tone === 'streak'}
      tint={tint.iconBg}
      contentStyle={styles.body}
    >
      <HomeSlotIcon slot="shortcut" Icon={Icon} tone={iconTone} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {nudge.title}
        </Text>
        {nudge.body ? (
          <Text style={styles.bodyText} numberOfLines={2}>
            {nudge.body}
          </Text>
        ) : null}
      </View>
      <View style={styles.arrow}>
        <ChevronRight size={16} color={HOME_UI.muted} strokeWidth={2.5} />
      </View>
    </HomeFeedCard>
  );
}

function createBadgeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    badge: {
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: HOME_UI.goldSoft,
      borderWidth: 1,
      borderColor: HOME_UI.goldBorder,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: HOME_UI.goldDeep,
      letterSpacing: 0.4,
    },
    spark: {
      color: HOME_UI.gold,
    },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 15,
      paddingHorizontal: 14,
      paddingLeft: 16,
    },
    copy: { flex: 1, minWidth: 0, gap: 3 },
    title: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: HOME_UI.ink,
      lineHeight: 19,
    },
    bodyText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.muted,
      lineHeight: 16,
    },
    arrow: {
      opacity: 0.7,
      flexShrink: 0,
    },
  });
}
