import { GraduationCap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, PremiumHeroCard, QueryStateView, Screen, SectionTitle } from '../../components';
import { useBookMentor, useMentors, useNetworkStatus } from '../../hooks';
import type { Mentor } from '../../api/mentors';
import { useTheme } from '../../theme';

function mentorName(mentor: Mentor): string {
  if (mentor.userId && typeof mentor.userId === 'object' && 'name' in mentor.userId) {
    return mentor.userId.name ?? 'Mentor';
  }
  return 'Mentor';
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const mentorsQuery = useMentors({ limit: 20 });
  const bookMentor = useBookMentor();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mentors = mentorsQuery.data?.items ?? [];
  const featured = mentors[0];
  const selected = mentors.find((m) => m.id === selectedId) ?? featured;

  const handleBook = async (slotStart: string) => {
    if (!selected) return;

    try {
      await bookMentor.mutateAsync({ id: selected.id, slotStart });
      Alert.alert('Booked', 'Your mentor session is confirmed.');
    } catch {
      Alert.alert('Booking failed', 'That slot may no longer be available.');
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Mentors" subtitle="Book 1:1 guidance from toppers" />

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
              eyebrow="Featured mentor"
              title={mentorName(featured)}
              stats={[
                { label: 'Rating', value: `★ ${featured.rating ?? 0}` },
                { label: 'Sessions', value: String(featured.sessionsCount ?? 0) },
              ]}
            >
              {featured.bio ? <Text style={styles.bio}>{featured.bio}</Text> : null}
              <Text style={styles.expertise}>{(featured.expertise ?? []).join(' · ')}</Text>
            </PremiumHeroCard>
          ) : null}

          <SectionTitle title="All mentors" />
          <View style={styles.list}>
            {mentors.map((mentor) => (
              <Pressable key={mentor.id} onPress={() => setSelectedId(mentor.id)}>
                <Card
                  style={
                    selected?.id === mentor.id
                      ? { ...styles.mentorCard, ...styles.mentorCardActive }
                      : styles.mentorCard
                  }
                >
                  <Text style={styles.mentorName}>{mentorName(mentor)}</Text>
                  <Text style={styles.mentorMeta}>
                    ★ {mentor.rating ?? 0} · {(mentor.expertise ?? []).slice(0, 2).join(', ')}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>

          {selected ? (
            <View style={styles.section}>
              <SectionTitle title="Book a slot" />
              <Card style={styles.slots}>
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
                  <Text style={styles.emptySlots}>No open slots right now.</Text>
                )}
              </Card>
            </View>
          ) : null}
        </>
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
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
