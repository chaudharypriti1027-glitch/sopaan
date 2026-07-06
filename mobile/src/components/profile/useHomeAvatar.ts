import { useAuthStore } from '../../store/auth';
import type { HomeFeed } from '../../types/home';
import { useAvatarSelection } from './useAvatarSelection';

/** Home hero avatar — same preset/photo as Profile, synced via auth profile + local preset. */
export function useHomeAvatar(greeting: HomeFeed['greeting']) {
  const profile = useAuthStore((state) => state.profile);

  return useAvatarSelection({
    userId: profile?.id,
    name: greeting.name ?? profile?.name,
    avatarUrl: greeting.avatarUrl ?? profile?.avatarUrl,
  });
}
