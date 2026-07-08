import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle, WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { Button } from './Button';
import { PREMIUM } from './premium/premiumStyles';
import { PremiumIcon } from './premium/PremiumIcon';
import { QueryStateSkeleton } from './premium/QueryStateSkeleton';

type QueryStateViewProps = {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isOffline: boolean;
  hasData: boolean;
  onRetry?: () => void;
  children: ReactNode;
  skeletonRows?: number;
};

export function QueryStateView({
  isLoading,
  isError,
  isFetching,
  isOffline,
  hasData,
  onRetry,
  children,
  skeletonRows = 3,
}: QueryStateViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isLoading && !hasData) {
    return <QueryStateSkeleton rows={skeletonRows} />;
  }

  if (isError && !hasData) {
    return (
      <View style={styles.errorCard}>
        <PremiumIcon
          Icon={isOffline ? WifiOff : AlertCircle}
          tone={isOffline ? 'gold' : 'coral'}
          size="md"
          filled
          depth
        />
        <Text style={styles.errorTitle}>{isOffline ? t('offline') : t('couldNotLoad')}</Text>
        <Text style={styles.errorBody}>{isOffline ? t('offlineHint') : t('connectionHint')}</Text>
        {onRetry ? (
          <Button
            label={isFetching ? t('retrying') : t('retry')}
            variant="gold"
            onPress={onRetry}
            loading={isFetching}
            fullWidth
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {isOffline && hasData ? (
        <View style={styles.cachedBanner}>
          <WifiOff size={14} color={PREMIUM.goldDeep} />
          <Text style={styles.cachedText}>{t('offlineCached')}</Text>
        </View>
      ) : null}

      {isError && hasData ? (
        <View style={styles.inlineError}>
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
        </View>
      ) : null}

      {children}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: { gap: theme.spacing.md },
    errorCard: {
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.xl,
      borderRadius: PREMIUM.cardRadius,
      backgroundColor: theme.colors.surface.default,
      borderWidth: 1,
      borderColor: 'rgba(236,232,221,0.9)',
    },
    errorTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PREMIUM.ink,
      textAlign: 'center',
    },
    errorBody: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    cachedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.md,
      backgroundColor: PREMIUM.goldSoft,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.25)',
    },
    cachedText: {
      ...theme.typography.presets.caption,
      color: PREMIUM.goldDeep,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
    },
    inlineError: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.surface.muted,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    },
    inlineErrorText: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      flex: 1,
    },
  });
}
