import { afterEach, describe, expect, it } from '@jest/globals';
import { env } from '../src/config/env.js';
import { getStreamingProvider, resetStreamingProviderForTests } from '../src/services/streaming/index.js';
import { devStreamingProvider, resetDevStreamingRoomsForTests } from '../src/services/streaming/devStreamingProvider.js';

describe('dev streaming provider', () => {
  afterEach(() => {
    resetStreamingProviderForTests();
    resetDevStreamingRoomsForTests();
  });

  it('auto-enables in development when LiveKit is not configured', () => {
    if (!env.isDevelopment) {
      return;
    }

    const provider = getStreamingProvider();
    expect(provider.id).toBe('dev');
    expect(provider.isConfigured()).toBe(true);
  });

  it('issues dev tokens and tracks participants', async () => {
    const provider = devStreamingProvider;
    await provider.createRoom({ roomName: 'sopaan-test-room' });

    const viewer = await provider.createViewerToken({
      roomName: 'sopaan-test-room',
      identity: 'student-1',
      name: 'Student',
    });

    expect(viewer.provider).toBe('dev');
    expect(viewer.url).toBe('dev://local-live');
    expect(viewer.token).toContain('dev-viewer');

    const count = await provider.getParticipantCount('sopaan-test-room');
    expect(count).toBe(1);
  });
});
