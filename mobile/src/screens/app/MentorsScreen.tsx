import { Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Screen, SectionTitle } from '../../components';
import { useBookMentor, useMentors } from '../../hooks';
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

      {mentorsQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <>
          {featured ? (
            <Card style={styles.featured}>
              <Text style={styles.featuredLabel}>Featured mentor</Text>
              <Text style={styles.featuredName}>{mentorName(featured)}</Text>
              <View style={styles.ratingRow}>
                <Star size={16} color={theme.colors.accent.gold} fill={theme.colors.accent.gold} />
                <Text style={styles.rating}>{featured.rating ?? 0}</Text>
                <Text style={styles.sessions}>{featured.sessionsCount ?? 0} sessions</Text>
              </View>
              {featured.bio ? <Text style={styles.bio}>{featured.bio}</Text> : null}
              <Text style={styles.expertise}>{(featured.expertise ?? []).join(' · ')}</Text>
            </Card>
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
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    featured: { gap: theme.spacing.sm, backgroundColor: theme.colors.brand.primaryMuted },
    featuredLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.brand.primary,
      textTransform: 'uppercase',
    },
    featuredName: { ...theme.typography.presets.h3, color: theme.colors.text.primary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    rating: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    sessions: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    bio: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    expertise: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
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
