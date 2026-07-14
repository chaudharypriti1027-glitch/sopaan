import { GraduationCap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FeatureScreenLayout,
  PremiumFeatureCard,
  PremiumHeroCard,
  QueryStateView,
  SectionTitle,
} from '../../components';
import { useBookMentor, useMentors, useNetworkStatus } from '../../hooks';
import type { Mentor } from '../../api/mentors';
import { useTheme } from '../../theme';

function mentorName(mentor: Mentor, fallback: string): string {
  if (mentor.name?.trim()) {
    return mentor.name;
  }
  if (mentor.userId && typeof mentor.userId === 'object' && 'name' in mentor.userId) {
    return mentor.userId.name ?? fallback;
  }
  return fallback;
}

function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MentorsScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const mentorsQuery = useMentors({ limit: 20 });
  const bookMentor = useBookMentor();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mentors = mentorsQuery.data?.items ?? [];
  const featured = mentors[0];
  const selected = mentors.find((m) => m.id === selectedId) ?? featured;
  const mentorFallback = t('mentors.mentor');

  const handleBook = async (slotStart: string) => {
    if (!selected) return;

    try {
      await bookMentor.mutateAsync({ id: selected.id, slotStart });
      Alert.alert(t('mentors.booked'), t('mentors.bookedBody'));
    } catch {
      Alert.alert(t('mentors.bookingFailed'), t('mentors.bookingFailedBody'));
    }
  };

  return (
    <FeatureScreenLayout title={t('mentors.title')} subtitle={t('mentors.subtitle')}>
      <QueryStateView
        isLoading={mentorsQuery.isLoading}
        isError={mentorsQuery.isError}
        isFetching={mentorsQuery.isFetching}
        isOffline={isOffline}
        hasData={mentors.length > 0}
        onRetry={() => void mentorsQuery.refetch()}
      >
        <>
          {featured ? (
            <PremiumHeroCard
              icon={<GraduationCap size={24} color="#FFFFFF" strokeWidth={1.8} />}
              eyebrow={t('mentors.featured')}
              title={mentorName(featured, mentorFallback)}
              stats={[
                { label: t('mentors.rating'), value: `★ ${featured.rating ?? 0}` },
                { label: t('mentors.sessionsLabel'), value: String(featured.sessionsCount ?? 0) },
              ]}
            >
              {featured.bio ? <Text style={styles.bio}>{featured.bio}</Text> : null}
              <Text style={styles.expertise}>{(featured.expertise ?? []).join(' · ')}</Text>
            </PremiumHeroCard>
          ) : null}

          <SectionTitle title={t('mentors.allMentors')} />
          <View style={styles.list}>
            {mentors.map((mentor) => (
              <Pressable key={mentor.id} onPress={() => setSelectedId(mentor.id)}>
                <PremiumFeatureCard
                  style={
                    selected?.id === mentor.id
                      ? { ...styles.mentorCard, ...styles.mentorCardActive }
                      : styles.mentorCard
                  }
                >
                  <Text style={styles.mentorName}>{mentorName(mentor, mentorFallback)}</Text>
                  <Text style={styles.mentorMeta}>
                    ★ {mentor.rating ?? 0} · {(mentor.expertise ?? []).slice(0, 2).join(', ')}
                  </Text>
                </PremiumFeatureCard>
              </Pressable>
            ))}
          </View>

          {selected ? (
            <View style={styles.section}>
              <SectionTitle title={t('mentors.bookSlot')} />
              <PremiumFeatureCard style={styles.slots}>
                {(selected.availableSlots ?? selected.slots ?? []).length > 0 ? (
                  (selected.availableSlots ?? selected.slots ?? []).map((slot) => (
                    <Button
                      key={slot.start}
                      label={formatSlot(slot.start)}
                      variant="ghost"
                      onPress={() => handleBook(slot.start)}
                      disabled={bookMentor.isPending || slot.isBooked}
                    />
                  ))
                ) : (
                  <Text style={styles.emptySlots}>{t('mentors.noSlots')}</Text>
                )}
              </PremiumFeatureCard>
            </View>
          ) : null}
        </>
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    bio: { ...theme.typography.presets.body, color: 'rgba(255,255,255,0.85)', zIndex: 1 },
    expertise: { ...theme.typography.presets.caption, color: 'rgba(255,255,255,0.55)', zIndex: 1 },
    list: { gap: theme.spacing.sm },
    mentorCard: { gap: theme.spacing.xs },
    mentorCardActive: { borderWidth: 2, borderColor: theme.colors.brand.primary },
    mentorName: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    mentorMeta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    section: { gap: theme.spacing.md },
    slots: { gap: theme.spacing.sm },
    emptySlots: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
