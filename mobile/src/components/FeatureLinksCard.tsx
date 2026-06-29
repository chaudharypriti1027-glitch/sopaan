import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { Card } from './Card';
import type { FeatureLinkTone, ProfileFeatureLink } from '../navigation/profileFeatureLinks';

type FeatureLinksCardProps = {
  links: ProfileFeatureLink[];
  onNavigate: (route: ProfileFeatureLink['route']) => void;
};

function toneColors(theme: ReturnType<typeof useTheme>['theme'], tone: FeatureLinkTone) {
  const map = {
    primary: {
      bg: theme.colors.brand.primaryMuted,
      fg: theme.colors.brand.primary,
    },
    gold: {
      bg: theme.colors.accent.goldMuted,
      fg: theme.colors.accent.goldOn,
    },
    teal: {
      bg: theme.colors.accent.tealMuted,
      fg: theme.colors.accent.teal,
    },
    coral: {
      bg: theme.colors.accent.coralMuted,
      fg: theme.colors.accent.coral,
    },
  } as const;

  return map[tone];
}

export function FeatureLinksCard({ links, onNavigate }: FeatureLinksCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('navigation');
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={styles.card}>
      {links.map((link, index) => {
        const Icon = link.icon;
        const colors = toneColors(theme, link.tone);

        return (
          <Pressable
            key={link.route}
            accessibilityRole="button"
            accessibilityLabel={t(link.labelKey)}
            onPress={() => onNavigate(link.route)}
            style={[styles.row, index > 0 && styles.rowBorder]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
              <Icon size={17} color={colors.fg} strokeWidth={2} />
            </View>
            <Text style={styles.label}>{t(link.labelKey)}</Text>
            <ChevronRight size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        );
      })}
    </Card>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      paddingVertical: theme.spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.subtle,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
  });
}
