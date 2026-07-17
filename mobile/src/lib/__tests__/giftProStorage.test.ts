import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetItem = jest.fn(async (_key: string) => null as string | null);
const mockSetItem = jest.fn(async (_key: string, _value: string) => undefined);

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (key: string) => mockGetItem(key),
    setItem: (key: string, value: string) => mockSetItem(key, value),
  },
}));

import {
  giftProCelebrationKey,
  hasSeenGiftProCelebration,
  markGiftProCelebrationSeen,
} from '../giftProStorage';

describe('giftProStorage', () => {
  beforeEach(() => {
    mockGetItem.mockClear();
    mockSetItem.mockClear();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
  });

  it('builds a stable celebration key', () => {
    expect(giftProCelebrationKey('ent1', '2026-07-17T10:00:00.000Z')).toBe(
      'ent1:2026-07-17T10:00:00.000Z',
    );
  });

  it('reports unseen gifts as not seen', async () => {
    await expect(hasSeenGiftProCelebration('k1')).resolves.toBe(false);
    expect(mockGetItem).toHaveBeenCalledWith('sopaan_gift_pro_seen_v2:k1');
  });

  it('marks celebrations as seen', async () => {
    await markGiftProCelebrationSeen('k2');
    expect(mockSetItem).toHaveBeenCalledWith('sopaan_gift_pro_seen_v2:k2', '1');
  });
});
