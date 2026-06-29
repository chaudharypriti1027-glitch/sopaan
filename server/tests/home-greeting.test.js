import { describe, expect, it } from '@jest/globals';
import { buildGreetingFromUser } from '../src/services/home/getGreeting.js';

describe('buildGreetingFromUser', () => {
  it('includes avatarUrl when present on user', () => {
    const greeting = buildGreetingFromUser({
      name: 'Priya',
      avatarUrl: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    });

    expect(greeting.avatarUrl).toBe('https://res.cloudinary.com/demo/image/upload/avatar.jpg');
    expect(greeting.name).toBe('Priya');
  });

  it('omits empty avatarUrl', () => {
    const greeting = buildGreetingFromUser({
      name: 'Priya',
      avatarUrl: '   ',
    });

    expect(greeting.avatarUrl).toBeUndefined();
  });
});
