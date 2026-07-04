export function formatMentor(doc) {
  const user = doc.userId && typeof doc.userId === 'object' ? doc.userId : null;

  return {
    id: doc._id.toString(),
    name: doc.name?.trim() || user?.name || 'Mentor',
    expertise: doc.expertise ?? [],
    subjects: doc.expertise ?? [],
    bio: doc.bio ?? null,
    rate: doc.rate ?? null,
    avatarUrl: doc.avatarUrl ?? null,
    rating: doc.rating ?? 0,
    sessionsCount: doc.sessionsCount ?? 0,
    isActive: doc.isActive !== false,
    userId: user
      ? {
          id: user._id?.toString?.() ?? String(user._id),
          name: user.name ?? null,
          email: user.email ?? null,
        }
      : null,
    slots: doc.slots ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
