import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../theme';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <WifiOff size={14} color={theme.colors.text.inverse} />
      <Text style={styles.text}>{t('offlineBanner')}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.semantic.warning,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    text: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.inverse,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
  });
}
