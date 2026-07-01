import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Clock3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

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
        <Text style={styles.badgeText}>{t('beta.badge')}</Text>
      </View>
      <Text style={styles.title}>{title ?? t('beta.comingSoonTitle')}</Text>
      <Text style={styles.body}>{body ?? t('beta.comingSoonBody')}</Text>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      gap: 6,
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
      fontSize: 10,
      fontWeight: '800',
      color: AUTH_UI.accent,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: AUTH_UI.ink,
    },
    body: {
      fontSize: 12,
      lineHeight: 18,
      color: AUTH_UI.muted,
    },
  });
}
