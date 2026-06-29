import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../../api/me';
import { getAuthStore, useAuthStore } from '../../store/auth';
import type { Profile } from '../../types/auth';

jest.mock('../../api/me', () => ({
  getMe: jest.fn(),
}));

const profile: Profile = {
  id: 'user_1',
  name: 'Priya',
  phone: '+919876543210',
  state: 'Gujarat',
  targetExam: 'SSC CGL',
  language: 'en',
  createdAt: '2026-01-01T00:00:00.000Z',
  rank: null,
  level: 1,
  coins: 0,
  onboardingComplete: true,
};

describe('useAuthStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await useAuthStore.getState().signOut();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
    jest.mocked(AsyncStorage.removeItem).mockResolvedValue(undefined);
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
    jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
  });

  it('setSession saves tokens and caches profile', async () => {
    await getAuthStore().setSession({
      token: 'access-token',
      refreshToken: 'refresh-token',
      profile,
      isNewUser: false,
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sopaan_access_token', 'access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sopaan_refresh_token', 'refresh-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('sopaan_profile_cache', JSON.stringify(profile));
    expect(getAuthStore().status).toBe('authed');
    expect(getAuthStore().profile?.name).toBe('Priya');
  });

  it('bootstrap returns guest when no token', async () => {
    const result = await getAuthStore().bootstrap();

    expect(result).toEqual({ kind: 'guest' });
    expect(getAuthStore().status).toBe('guest');
  });

  it('bootstrap refreshes profile when token exists', async () => {
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => {
      if (key === 'sopaan_access_token') return 'access-token';
      if (key === 'sopaan_refresh_token') return 'refresh-token';
      return null;
    });
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(profile));
    jest.mocked(getMe).mockResolvedValue({ ...profile, name: 'Priya (fresh)' });

    const result = await getAuthStore().bootstrap();

    expect(result).toEqual({
      kind: 'authed',
      profile: { ...profile, name: 'Priya (fresh)' },
      optimistic: false,
    });
    expect(getMe).toHaveBeenCalled();
  });

  it('bootstrap returns optimistic authed when network fails but cache exists', async () => {
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => {
      if (key === 'sopaan_access_token') return 'access-token';
      if (key === 'sopaan_refresh_token') return 'refresh-token';
      return null;
    });
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(profile));
    jest.mocked(getMe).mockRejectedValue(new Error('offline'));

    const result = await getAuthStore().bootstrap();

    expect(result).toEqual({ kind: 'authed', profile, optimistic: true });
    expect(getAuthStore().status).toBe('authed');
  });

  it('signOut clears tokens and cached profile', async () => {
    await getAuthStore().setSession({
      token: 'access-token',
      refreshToken: 'refresh-token',
      profile,
      isNewUser: false,
    });

    await getAuthStore().signOut();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('sopaan_profile_cache');
    expect(getAuthStore().status).toBe('guest');
    expect(getAuthStore().profile).toBeNull();
  });
});
