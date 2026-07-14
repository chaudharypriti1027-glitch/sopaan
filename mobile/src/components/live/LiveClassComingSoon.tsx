import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../Card';
import { useTheme } from '../../theme';

type LiveClassComingSoonProps = {
  message?: string | null;
};

export function LiveClassComingSoon({ message }: LiveClassComingSoonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('app', { keyPrefix: 'liveClasses' });
  const { t: tViewer } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <Sparkles size={24} color={theme.colors.accent.gold} />
        <Text style={styles.title}>{t('comingSoon')}</Text>
        <Text style={styles.body}>
          {message ?? tViewer('comingSoonBodyExtended')}
        </Text>
      </Card>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: '#0b1020',
    },
    card: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.accent.goldMuted,
      borderWidth: 1,
      borderColor: theme.colors.accent.gold,
      maxWidth: 360,
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    body: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });
}
