import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { ProfileSummary } from '../../api/me';
import { NumText } from '../NumText';
import { Skeleton } from '../Skeleton';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { homePremiumCard } from '../home/homeStyles';
import { formatProfileSummaryCount } from './profileMenu';
import type { ProfileMenuSection } from './profileMenuTypes';

const toneStyles = {
  indigo: { bg: '#ECEBFB', fg: '#3A36CC' },
  teal: { bg: '#DBF4F0', fg: '#0FA896' },
  gold: { bg: '#FDF1D8', fg: '#C97E00' },
  coral: { bg: '#FDE6E4', fg: '#F2554B' },
} as const;

type ProfileMenuSectionCardProps = {
  section: ProfileMenuSection;
  summary?: ProfileSummary;
  summaryLoading?: boolean;
  onItemPress: (itemId: string) => void;
};

export function ProfileMenuSectionCard({
  section,
  summary,
  summaryLoading = false,
  onItemPress,
}: ProfileMenuSectionCardProps) {
  const { t } = useTranslation(['app', 'common']);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      {section.items.map((item, index) => {
        const tone = toneStyles[item.tone];
        const Icon = item.icon;
        const countValue = item.countKey ? summary?.[item.countKey] : undefined;
        const label = t(`app:profile.menu.${item.labelKey}`);
        const meta = item.metaKey ? t(`common:${item.metaKey}`) : undefined;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={label}
            testID={item.testID}
            onPress={() => onItemPress(item.id)}
            style={({ pressed }) => [styles.row, index > 0 && styles.rowBorder, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: tone.bg }]}>
              <Icon size={20} color={tone.fg} strokeWidth={1.75} />
            </View>
            <Text style={styles.label}>{label}</Text>
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : item.countKey ? (
              summaryLoading ? (
                <Skeleton width={22} height={12} borderRadius={6} />
              ) : (
                <NumText style={styles.meta} testID={`profile-count-${item.id}`}>
                  {formatProfileSummaryCount(countValue)}
                </NumText>
              )
            ) : meta ? (
              <NumText style={styles.meta}>{meta}</NumText>
            ) : null}
            <ChevronRight size={18} color="#A2A5BC" strokeWidth={1.75} />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      paddingHorizontal: 16,
      paddingVertical: 4,
      ...homePremiumCard(theme),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingVertical: 13,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#F4F5FA',
    },
    pressed: {
      opacity: 0.92,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 13.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    meta: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: '#A2A5BC',
      marginRight: 2,
    },
    badge: {
      backgroundColor: '#F2554B',
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginRight: 2,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}
