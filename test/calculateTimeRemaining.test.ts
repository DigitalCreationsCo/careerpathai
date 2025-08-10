// calculateTimeRemaining.test.ts
import { calculateTimeRemaining } from '../lib/utils';

describe('calculateTimeRemaining', () => {
  const MS_IN_HOUR = 1000 * 60 * 60;
  const MS_IN_DAY = MS_IN_HOUR * 24;

  it('returns 0 days and 0 hours if launch is in the past', () => {
    const pastDate = new Date(Date.now() - MS_IN_DAY);
    const result = calculateTimeRemaining(pastDate);
    expect(result).toEqual({ days: 0, hours: 0 });
  });

  it('calculates correct days and hours for future date', () => {
    const now = Date.now();
    const launch = new Date(now + MS_IN_DAY * 3 + MS_IN_HOUR * 5); // 3 days and 5 hours ahead
    const result = calculateTimeRemaining(launch);
    expect(result.days).toBe(3);
    expect(result.hours).toBe(5);
  });

  it('returns zero if launch is exactly now', () => {
    const now = new Date();
    const result = calculateTimeRemaining(now);
    expect(result).toEqual({ days: 0, hours: 0 });
  });

  it('rounds down fractional hours', () => {
    const now = Date.now();
    const launch = new Date(now + MS_IN_DAY * 1 + MS_IN_HOUR * 23 + 59 * 60 * 1000); // 1 day 23 hours 59 minutes
    const result = calculateTimeRemaining(launch);
    expect(result.days).toBe(1);
    expect(result.hours).toBe(23); // minutes truncated, not rounded up
  });
});
