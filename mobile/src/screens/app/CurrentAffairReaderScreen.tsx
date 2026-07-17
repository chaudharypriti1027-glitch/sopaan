import { useMemo, useState, useEffect, useCallback } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Download, ExternalLink, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Button, OptimizedImage, QueryStateView, Text } from '../../components';
import { CA_UI, CaAiSummaryCard, caFeedCard } from '../../components/currentAffairs';
import {
  categoryStyle,
  isTrendingAffair,
} from '../../components/currentAffairs/caUtils';
import { PremiumScreen } from '../../components/premium';
import { PREMIUM } from '../../components/premium/premiumStyles';
import { useCurrentAffair, useCurrentAffairAiSummary, useNetworkStatus } from '../../hooks';
import { cacheAffair, isAffairCached, removeCachedAffair } from '../../affairs/offlineAffairCache';
import { useFormat } from '../../i18n/useFormat';
import { navigateToAskAI } from '../../navigation/askAiNavigation';
import type { MainStackParamList } from '../../navigation/types';

type ReaderRoute = RouteProp<MainStackParamList, 'CurrentAffairReader'>;
type ReaderNav = NativeStackNavigationProp<MainStackParamList, 'CurrentAffairReader'>;

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
  const navigation = useNavigation<ReaderNav>();
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const styles = useMemo(() => createStyles(), []);

  const { isOffline } = useNetworkStatus();
  const affairQuery = useCurrentAffair(route.params.affairId);
  const aiSummaryQuery = useCurrentAffairAiSummary(route.params.affairId);
  const affair = affairQuery.data;
  const [offlineSaved, setOfflineSaved] = useState(false);

  useEffect(() => {
    if (!affair?.id) {
      setOfflineSaved(false);
      return;
    }

    void isAffairCached(affair.id).then(setOfflineSaved);
  }, [affair?.id]);

  const toggleOfflineSave = useCallback(async () => {
    if (!affair) {
      return;
    }

    if (offlineSaved) {
      await removeCachedAffair(affair.id);
      setOfflineSaved(false);
      return;
    }

    await cacheAffair(affair);
    setOfflineSaved(true);
    Alert.alert(t('currentAffairs.downloadedTitle'), t('currentAffairs.downloadedBody'));
  }, [affair, offlineSaved, t]);

  const bodyText = formatArticleBody(affair?.body || affair?.summary);
  const trending = affair ? isTrendingAffair(affair) : false;
  const catStyle = affair ? categoryStyle(affair.category) : null;

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
              <View style={styles.heroPlate}>
                <OptimizedImage uri={affair.imageUrl} style={styles.hero} contentFit="cover" />
                {trending ? (
                  <LinearGradient
                    colors={[CA_UI.goldLt, CA_UI.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hotBadge}
                  >
                    <Flame size={9} color="#2A2110" fill="#2A2110" />
                    <Text style={styles.hotText}>HOT</Text>
                  </LinearGradient>
                ) : null}
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <View style={[styles.categoryPill, catStyle && { backgroundColor: catStyle.bg }]}>
                <Text style={[styles.category, catStyle && { color: catStyle.color }]}>
                  {(affair.category ?? t('currentAffairs.general')).toUpperCase()}
                </Text>
              </View>
              {formattedDate ? <Text style={styles.date}>{formattedDate}</Text> : null}
            </View>

            <Text style={styles.title}>{affair.title}</Text>

            {typeof affair.state === 'string' && affair.state !== 'National' ? (
              <View style={styles.metaChips}>
                <View style={styles.stateChip}>
                  <Text style={styles.stateChipText}>{affair.state}</Text>
                </View>
              </View>
            ) : null}

            {affair.source ? (
              <Text style={styles.source}>
                {t('currentAffairs.sourceLabel', { source: affair.source })}
              </Text>
            ) : null}

            <CaAiSummaryCard
              summary={aiSummaryQuery.data}
              isLoading={aiSummaryQuery.isLoading}
              isError={aiSummaryQuery.isError}
              onRetry={() => void aiSummaryQuery.refetch()}
            />

            <View style={styles.bodyCard}>
              <Text style={styles.body}>{bodyText}</Text>
            </View>

            {(affair.quizQuestionCount ?? 0) > 0 ? (
              <Button
                label={t('currentAffairs.playQuiz')}
                variant="gold"
                fullWidth
                onPress={() =>
                  navigation.navigate('GamePlay', {
                    gameId: 'rapid-fire',
                    affairId: affair.id,
                  })
                }
              />
            ) : null}

            <Button
              label={t('currentAffairs.askAboutThis')}
              variant="ghost"
              fullWidth
              onPress={() =>
                navigateToAskAI(navigation, {
                  initialPrompt: `Explain this current affair for my exam: ${affair.title}`,
                })
              }
            />

            {affair.sourceUrl ? (
              <Button
                label={t('currentAffairs.readOriginal')}
                variant="gold"
                fullWidth
                onPress={openSource}
                icon={<ExternalLink size={16} color={PREMIUM.ink} />}
              />
            ) : null}

            <Button
              label={
                offlineSaved
                  ? t('currentAffairs.savedOffline')
                  : t('currentAffairs.downloadOffline')
              }
              variant={offlineSaved ? 'ghost' : 'primary'}
              fullWidth
              onPress={() => void toggleOfflineSave()}
              icon={
                offlineSaved ? (
                  <Check size={16} color={PREMIUM.ink} />
                ) : (
                  <Download size={16} color="#FFFFFF" />
                )
              }
            />
          </View>
        ) : null}
      </QueryStateView>
    </PremiumScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    article: {
      gap: 14,
      paddingBottom: 24,
    },
    heroPlate: {
      ...caFeedCard({ padding: 0 }),
      overflow: 'hidden',
    },
    hero: {
      width: '100%',
      height: 210,
    },
    hotBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    hotText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
      color: '#2A2110',
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    categoryPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: CA_UI.accentSoft,
    },
    category: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: CA_UI.accent,
    },
    date: {
      fontSize: 11,
      fontWeight: '600',
      color: CA_UI.muted,
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '800',
      color: CA_UI.text,
      letterSpacing: -0.4,
    },
    metaChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    readChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: CA_UI.surface,
      borderWidth: 1,
      borderColor: CA_UI.border,
    },
    readChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: CA_UI.muted,
    },
    stateChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: CA_UI.goldSoft,
      borderWidth: 1,
      borderColor: CA_UI.goldBorder,
    },
    stateChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: CA_UI.goldDeep,
    },
    source: {
      fontSize: 12,
      fontWeight: '600',
      color: CA_UI.muted,
    },
    bodyCard: {
      ...caFeedCard({ padding: 18 }),
    },
    body: {
      fontSize: 16,
      lineHeight: 26,
      fontWeight: '500',
      color: CA_UI.text2,
    },
  });
}
