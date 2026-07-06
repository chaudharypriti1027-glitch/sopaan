import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HomeSlotIcon } from './HomePremiumIcon';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { HOME_UI } from './homeTheme';

/** Thin banner when showing a cached home feed while offline. */
export function HomeOfflineBanner() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.banner} testID="home-offline-banner">
      <HomeSlotIcon slot="inline" Icon={WifiOff} tone="gold" />
      <Text style={styles.label}>{t('home.offlineSaved')}</Text>
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
      paddingVertical: 9,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: HOME_UI.goldSoft,
      borderBottomWidth: 1,
      borderBottomColor: HOME_UI.goldBorder,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.goldDeep,
    },
  });
}
