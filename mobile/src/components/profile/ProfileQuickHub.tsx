import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  Target,
  Trophy,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import type { ProfileSummary } from '../../api/me';
import { MENU_TONE_STYLES } from '../premium/premiumIconTokens';
import { PROFILE, profileCard } from './profileTheme';

type HubItem = {
  id: string;
  labelKey: string;
  route: string;
  icon: LucideIcon;
  tone: keyof typeof MENU_TONE_STYLES;
  countKey?: keyof ProfileSummary;
};

const HUB_ITEMS: HubItem[] = [
  { id: 'performance', labelKey: 'menu.performance', route: 'ProgressAnalytics', icon: BarChart3, tone: 'indigo' },
  { id: 'courses', labelKey: 'menu.courses', route: 'Courses', icon: BookOpen, tone: 'teal', countKey: 'courses' },
  { id: 'saved', labelKey: 'menu.saved', route: 'Notes', icon: Bookmark, tone: 'gold', countKey: 'savedQuestions' },
  { id: 'mistakes', labelKey: 'menu.mistakes', route: 'MockAnalysis', icon: Target, tone: 'indigo', countKey: 'mistakes' },
  { id: 'rewards', labelKey: 'menu.badges', route: 'Rewards', icon: Trophy, tone: 'gold', countKey: 'achievements' },
  { id: 'refer', labelKey: 'menu.refer', route: 'ReferEarn', icon: UserPlus, tone: 'teal' },
];

type ProfileQuickHubProps = {
  summary?: ProfileSummary;
  onNavigate: (route: string) => void;
};

export function ProfileQuickHub({ summary, onNavigate }: ProfileQuickHubProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{t('profile.quickLinks')}</Text>
      <View style={styles.grid}>
        {HUB_ITEMS.map((item) => {
          const tone = MENU_TONE_STYLES[item.tone];
          const Icon = item.icon;
          const count = item.countKey ? summary?.[item.countKey] : undefined;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={t(`profile.${item.labelKey}`)}
              testID={`profile-hub-${item.id}`}
              onPress={() => onNavigate(item.route)}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            >
              <View style={[styles.icon, { backgroundColor: tone.bg }]}>
                <Icon size={20} color={tone.fg} strokeWidth={1.75} />
              </View>
              <Text style={styles.label} numberOfLines={2} ellipsizeMode="tail">
                {t(`profile.${item.labelKey}`)}
              </Text>
              {count != null ? (
                <NumText style={styles.count}>{count}</NumText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      padding: 14,
      ...profileCard(theme),
    },
    heading: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.ink,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tile: {
      width: '31%',
      flexGrow: 1,
      minWidth: 96,
      minHeight: 108,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderRadius: 16,
      backgroundColor: PROFILE.hair,
      borderWidth: 1,
      borderColor: 'rgba(236,232,221,0.9)',
    },
    tilePressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    icon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      width: '100%',
      fontSize: 10.5,
      lineHeight: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: PROFILE.ink2,
      textAlign: 'center',
      minHeight: 26,
    },
    count: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: PROFILE.goldDeep,
    },
  });
}
