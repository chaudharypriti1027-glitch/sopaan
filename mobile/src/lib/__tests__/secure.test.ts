import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { clearTokens, getTokens, saveTokens } from '../secure';

describe('secure token storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveTokens and getTokens round-trip', async () => {
    jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => {
      if (key === 'sopaan_access_token') return 'access-token';
      if (key === 'sopaan_refresh_token') return 'refresh-token';
      return null;
    });

    await saveTokens({ token: 'access-token', refreshToken: 'refresh-token' });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sopaan_access_token', 'access-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sopaan_refresh_token', 'refresh-token');

    const tokens = await getTokens();
    expect(tokens).toEqual({ token: 'access-token', refreshToken: 'refresh-token' });
  });

  it('clearTokens removes both keys', async () => {
    jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);

    await clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sopaan_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sopaan_refresh_token');
  });
});
