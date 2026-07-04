import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { ExternalLink } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button, OptimizedImage, QueryStateView, Text } from '../../components';
import { PremiumScreen } from '../../components/premium';
import { useCurrentAffair, useNetworkStatus } from '../../hooks';
import { useFormat } from '../../i18n/useFormat';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type ReaderRoute = RouteProp<MainStackParamList, 'CurrentAffairReader'>;

function formatArticleBody(text?: string) {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function CurrentAffairReaderScreen() {
  const route = useRoute<ReaderRoute>();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const affairQuery = useCurrentAffair(route.params.affairId);
  const affair = affairQuery.data;

  const bodyText = formatArticleBody(affair?.body || affair?.summary);

  const formattedDate = affair?.publishedAt
    ? formatDate(affair.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const openSource = () => {
    if (affair?.sourceUrl) {
      void Linking.openURL(affair.sourceUrl);
    }
  };

  return (
    <PremiumScreen scroll bottomInset="stack">
      <QueryStateView
        isLoading={affairQuery.isLoading}
        isError={affairQuery.isError}
        isFetching={affairQuery.isFetching}
        isOffline={isOffline}
        hasData={Boolean(affair)}
        onRetry={() => void affairQuery.refetch()}
      >
        {affair ? (
        <View style={styles.article}>
          {affair.imageUrl ? (
            <OptimizedImage uri={affair.imageUrl} style={styles.hero} contentFit="cover" />
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.category}>{(affair.category ?? t('currentAffairs.general')).toUpperCase()}</Text>
            {formattedDate ? <Text style={styles.date}>{formattedDate}</Text> : null}
          </View>

          <Text style={styles.title}>{affair.title}</Text>

          {affair.source ? (
            <Text style={styles.source}>
              {t('currentAffairs.sourceLabel', { source: affair.source })}
            </Text>
          ) : null}

          {typeof affair.state === 'string' && affair.state !== 'National' ? (
            <Text style={styles.state}>{affair.state}</Text>
          ) : null}

          <Text style={styles.body}>{bodyText}</Text>

          {affair.sourceUrl ? (
            <Button
              label={t('currentAffairs.readOriginal')}
              variant="ghost"
              fullWidth
              onPress={openSource}
              icon={<ExternalLink size={16} color={theme.colors.brand.primary} />}
            />
          ) : null}
        </View>
        ) : null}
      </QueryStateView>
    </PremiumScreen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    article: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    hero: {
      width: '100%',
      height: 200,
      borderRadius: 20,
      marginBottom: theme.spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    category: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: theme.colors.brand.primary,
    },
    date: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.tertiary,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: theme.colors.text.primary,
      letterSpacing: -0.3,
    },
    source: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
    state: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: theme.colors.text.tertiary,
    },
    body: {
      fontSize: 15,
      lineHeight: 24,
      fontFamily: theme.typography.fonts.ui.regular,
      color: theme.colors.text.primary,
    },
    muted: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      paddingVertical: theme.spacing.xl,
    },
    errorBox: {
      gap: theme.spacing.md,
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    errorTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.secondary,
    },
  });
}
