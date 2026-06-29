import { useMemo, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { Button } from './Button';
import { Card } from './Card';

type QueryStateViewProps = {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isOffline: boolean;
  hasData: boolean;
  onRetry?: () => void;
  children: ReactNode;
};

export function QueryStateView({
  isLoading,
  isError,
  isFetching,
  isOffline,
  hasData,
  onRetry,
  children,
}: QueryStateViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isLoading && !hasData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  if (isError && !hasData) {
    return (
      <Card style={styles.errorCard}>
        <WifiOff size={28} color={theme.colors.text.tertiary} />
        <Text style={styles.errorTitle}>{isOffline ? t('offline') : t('couldNotLoad')}</Text>
        <Text style={styles.errorBody}>{isOffline ? t('offlineHint') : t('connectionHint')}</Text>
        {onRetry ? (
          <Button
            label={isFetching ? t('retrying') : t('retry')}
            onPress={onRetry}
            loading={isFetching}
            fullWidth
          />
        ) : null}
      </Card>
    );
  }

  return (
    <View style={styles.wrap}>
      {isOffline && hasData ? (
        <View style={styles.cachedBanner}>
          <WifiOff size={14} color={theme.colors.semantic.warning} />
          <Text style={styles.cachedText}>{t('offlineCached')}</Text>
        </View>
      ) : null}

      {isError && hasData ? (
        <Card style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{t('couldNotRefresh')}</Text>
          {onRetry ? (
            <Button
              label={isFetching ? t('retrying') : t('retry')}
              variant="ghost"
              size="sm"
              onPress={onRetry}
              loading={isFetching}
            />
          ) : null}
        </Card>
      ) : null}

      {children}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: { gap: theme.spacing.md },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    errorCard: {
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.xl,
    },
    errorTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    errorBody: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    cachedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.semantic.warningMuted,
    },
    cachedText: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.warning,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    inlineError: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    inlineErrorText: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      flex: 1,
    },
  });
}
