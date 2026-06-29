import { Linking, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Screen, SopaanLogo } from '../components';
import type { VersionRequirements } from '../api/appConfig';
import { useTheme } from '../theme';

type ForceUpdateScreenProps = {
  requirements: VersionRequirements;
};

export function ForceUpdateScreen({ requirements }: ForceUpdateScreenProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = createStyles(theme);

  const openStore = () => {
    const url = requirements.storeUrl;
    if (url) {
      void Linking.openURL(url);
    }
  };

  return (
    <Screen style={styles.container} contentContainerStyle={styles.content}>
      <SopaanLogo size={88} />
      <Text style={styles.title}>{requirements.forceUpdateTitle}</Text>
      <Text style={styles.message}>{requirements.forceUpdateMessage}</Text>
      <Text style={styles.meta}>
        {t('forceUpdate.versionHint', {
          min: requirements.minNativeVersion,
          latest: requirements.latestNativeVersion,
        })}
      </Text>
      <Button
        label={t('forceUpdate.updateStore')}
        testID="force-update-open-store"
        fullWidth
        size="lg"
        onPress={openStore}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing['2xl'],
      paddingVertical: theme.spacing['3xl'],
    },
    title: {
      ...theme.typography.presets.h2,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    message: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    meta: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
  });
}
