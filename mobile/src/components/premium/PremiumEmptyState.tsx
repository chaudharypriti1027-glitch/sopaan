import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { PremiumIcon } from './PremiumIcon';
import type { PremiumIconTone } from './premiumIconTokens';
import { premiumCard, PREMIUM } from './premiumStyles';

type PremiumEmptyStateProps = {
  title: string;
  hint?: string;
  Icon?: LucideIcon;
  tone?: PremiumIconTone;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/** Illustrated empty state — icon tile, title, hint, optional gold CTA. */
export function PremiumEmptyState({
  title,
  hint,
  Icon = Inbox,
  tone = 'slate',
  actionLabel,
  onAction,
  testID,
}: PremiumEmptyStateProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.card}>
        <PremiumIcon Icon={Icon} tone={tone} size="md" filled depth />
        <Text style={styles.title}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      paddingVertical: 8,
    },
    card: {
      ...premiumCard(theme),
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 24,
      gap: 8,
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: PREMIUM.ink,
      letterSpacing: -0.2,
      marginTop: 4,
      textAlign: 'center',
    },
    hint: {
      fontSize: 12,
      fontWeight: '600',
      color: PREMIUM.sectionLabel,
      textAlign: 'center',
      lineHeight: 17,
      marginBottom: 4,
    },
    btn: {
      marginTop: 4,
      backgroundColor: PREMIUM.goldSoft,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: PREMIUM.gold,
    },
    btnPressed: {
      opacity: 0.9,
    },
    btnText: {
      fontSize: 12,
      fontWeight: '800',
      color: PREMIUM.goldDeep,
    },
  });
}
