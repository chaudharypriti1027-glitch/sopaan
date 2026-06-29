import type { ErrorEvent } from '@sentry/types';
import { scrubSentryEvent } from '../scrubSentryEvent';

describe('scrubSentryEvent', () => {
  it('redacts sensitive request fields and keeps user id only', () => {
    const event = {
      request: {
        headers: { authorization: 'Bearer secret' },
        data: { email: 'user@example.com', answerText: 'federalism' },
      },
      user: { id: 'user-1', email: 'user@example.com' },
      extra: { token: 'abc' },
    } as unknown as ErrorEvent;

    const scrubbed = scrubSentryEvent(event);

    expect((scrubbed.request as { headers: Record<string, string> }).headers.authorization).toBe(
      '[REDACTED]',
    );
    expect((scrubbed.request as { data: Record<string, string> }).data.email).toBe('[REDACTED]');
    expect((scrubbed.request as { data: Record<string, string> }).data.answerText).toBe(
      'federalism',
    );
    expect(scrubbed.user).toEqual({ id: 'user-1' });
    expect((scrubbed.extra as Record<string, string>).token).toBe('[REDACTED]');
  });
});
