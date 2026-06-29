import { describe, expect, it } from '@jest/globals';
import { scrubSentryEvent } from '../src/observability/scrubSentryEvent.js';

describe('scrubSentryEvent', () => {
  it('redacts sensitive headers and request body fields', () => {
    const event = {
      request: {
        headers: {
          authorization: 'Bearer secret-token',
          'content-type': 'application/json',
        },
        cookies: 'session=abc',
        data: {
          email: 'user@example.com',
          password: 'hunter2',
          question: 'What is GDP?',
        },
      },
      user: {
        id: 'user-1',
        email: 'user@example.com',
      },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.request.headers.authorization).toBe('[REDACTED]');
    expect(scrubbed.request.headers['content-type']).toBe('application/json');
    expect(scrubbed.request.cookies).toBe('[REDACTED]');
    expect(scrubbed.request.data.email).toBe('[REDACTED]');
    expect(scrubbed.request.data.password).toBe('[REDACTED]');
    expect(scrubbed.request.data.question).toBe('What is GDP?');
    expect(scrubbed.user).toEqual({ id: 'user-1' });
  });
});
