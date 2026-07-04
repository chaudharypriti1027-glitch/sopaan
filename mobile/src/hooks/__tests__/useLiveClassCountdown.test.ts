import { describe, expect, it, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { useLiveClassCountdown } from '../useLiveClassCountdown';

describe('useLiveClassCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-04T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down to the scheduled start time', () => {
    const target = '2026-07-04T10:01:05.000Z';
    const { result } = renderHook(() => useLiveClassCountdown(target));

    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(5);
    expect(result.current.isPast).toBe(false);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(0);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current.isPast).toBe(true);
    expect(result.current.totalMs).toBe(0);
  });
});
