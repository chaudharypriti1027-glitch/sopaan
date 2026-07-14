import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Clock3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { AUTH_SPACING, AUTH_UI } from './authTheme';

type ComingSoonNoticeProps = {
  title?: string;
  body?: string;
};

export function ComingSoonNotice({ title, body }: ComingSoonNoticeProps) {
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Clock3 size={14} color={AUTH_UI.accent} />
        <Text variant="eyebrow" style={styles.badgeText}>
          {t('beta.badge')}
        </Text>
      </View>
      <Text variant="bodyMedium" style={styles.title}>
        {title ?? t('beta.comingSoonTitle')}
      </Text>
      <Text variant="caption" color="secondary" style={styles.body}>{body ?? t('beta.comingSoonBody')}</Text>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      gap: AUTH_SPACING.stack,
      padding: 14,
      borderRadius: AUTH_UI.inputRadius,
      backgroundColor: AUTH_UI.focusRing,
      borderWidth: 1,
      borderColor: AUTH_UI.borderHover,
      marginBottom: 12,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: AUTH_UI.card,
      borderWidth: 1,
      borderColor: AUTH_UI.borderHover,
    },
    badgeText: {
      color: AUTH_UI.accent,
    },
    title: {
      color: AUTH_UI.ink,
    },
    body: {
      lineHeight: 18,
    },
  });
}
