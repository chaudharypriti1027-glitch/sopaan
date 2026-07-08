import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, SectionTitle } from '../../components';
import { parseApiError } from '../../api';
import { getPolicy, type PrivacyPolicy } from '../../api/privacy';
import { useTheme } from '../../theme';

export function PrivacyPolicyScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setPolicy(await getPolicy());
      } catch (err) {
        setError(parseApiError(err).message);
      }
    })();
  }, []);

  if (error) {
    return (
      <Screen>
        <Text style={styles.error}>{error}</Text>
      </Screen>
    );
  }

  if (!policy) {
    return (
      <Screen>
        <ActivityIndicator color={theme.colors.brand.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        subtitle={t('privacyPolicy.versionSubtitle', {
          version: policy.version,
          jurisdiction: policy.jurisdiction,
        })}
      />
      <Text style={styles.disclaimer}>{policy.disclaimer}</Text>
      {policy.sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.body ? <Text style={styles.body}>{section.body}</Text> : null}
          {Array.isArray(section.items)
            ? section.items.map((item, index) => (
                <Text key={index} style={styles.body}>
                  {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                </Text>
              ))
            : null}
        </View>
      ))}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    disclaimer: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
    },
    section: { gap: theme.spacing.sm },
    sectionTitle: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
    },
    body: {
      ...theme.typography.presets.body,
      color: theme.colors.text.secondary,
    },
    error: {
      ...theme.typography.presets.body,
      color: theme.colors.semantic.error,
    },
  });
}
