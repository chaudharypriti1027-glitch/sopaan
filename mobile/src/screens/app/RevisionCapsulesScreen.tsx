import { Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  FeatureScreenLayout,
  PremiumFeatureCard,
  QueryStateView,
} from '../../components';
import { useNetworkStatus, useRevisionCapsules } from '../../hooks';
import { useTheme } from '../../theme';

export function RevisionCapsulesScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isOffline } = useNetworkStatus();

  const capsulesQuery = useRevisionCapsules({ limit: 30 });
  const capsules = capsulesQuery.data?.items ?? [];
  const hasData = capsules.length > 0;

  return (
    <FeatureScreenLayout
      title={t('revisionCapsules.title')}
      subtitle={t('revisionCapsules.subtitle')}
    >
      <QueryStateView
        isLoading={capsulesQuery.isLoading}
        isError={capsulesQuery.isError}
        isFetching={capsulesQuery.isFetching}
        isOffline={isOffline}
        hasData={hasData}
        onRetry={() => void capsulesQuery.refetch()}
      >
        <View style={styles.list}>
          {capsules.map((capsule) => {
            const expanded = expandedId === capsule.id;
            return (
              <PremiumFeatureCard key={capsule.id} style={styles.card}>
                <Pressable onPress={() => setExpandedId(expanded ? null : capsule.id)}>
                  <View style={styles.header}>
                    <View style={styles.headerText}>
                      <Text style={styles.subject}>{capsule.subject}</Text>
                      <Text style={styles.title}>{capsule.title}</Text>
                    </View>
                    <View style={styles.readTime}>
                      <Clock size={14} color={theme.colors.text.tertiary} />
                      <Text style={styles.readMin}>
                        {t('revisionCapsules.readMin', { count: capsule.readMinutes ?? 5 })}
                      </Text>
                    </View>
                  </View>
                  {expanded ? (
                    <Text style={styles.body}>{capsule.body}</Text>
                  ) : (
                    <Text style={styles.preview} numberOfLines={2}>
                      {capsule.body.replace(/[#*`$]/g, '')}
                    </Text>
                  )}
                  <Text style={styles.toggle}>
                    {expanded ? t('revisionCapsules.showLess') : t('revisionCapsules.readNow')}
                  </Text>
                </Pressable>
              </PremiumFeatureCard>
            );
          })}
        </View>
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    list: { gap: theme.spacing.md },
    card: { gap: theme.spacing.sm, padding: theme.spacing.md },
    header: { flexDirection: 'row', gap: theme.spacing.md },
    headerText: { flex: 1, gap: theme.spacing.xs },
    subject: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    readTime: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    readMin: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    preview: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    body: { ...theme.typography.presets.body, color: theme.colors.text.primary, marginTop: theme.spacing.sm },
    toggle: {
      ...theme.typography.presets.caption,
      color: theme.colors.brand.primary,
      marginTop: theme.spacing.sm,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
  });
}
