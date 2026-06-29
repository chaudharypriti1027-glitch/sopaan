import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ForceUpdateScreen } from './ForceUpdateScreen';
import { useReleaseGate } from './useReleaseGate';
import { useTheme } from '../theme';

type ReleaseGateProps = {
  children: React.ReactNode;
};

export function ReleaseGate({ children }: ReleaseGateProps) {
  const gate = useReleaseGate();
  const { theme } = useTheme();
  const { t } = useTranslation('release');
  const styles = createStyles(theme);

  if (gate.status === 'force-update') {
    return <ForceUpdateScreen requirements={gate.requirements} />;
  }

  if (gate.status === 'checking' || gate.status === 'downloading-ota') {
    return (
      <View style={styles.boot} testID="release-gate-loading">
        <ActivityIndicator size="large" color={theme.colors.brand.onPrimary} />
        <Text style={styles.label}>
          {gate.status === 'downloading-ota' ? t('downloading') : t('checking')}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    boot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.brand.primary,
    },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.brand.onPrimary,
    },
  });
}
