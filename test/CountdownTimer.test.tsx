// CountdownTimer.test.tsx
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CountdownTimer } from '../components/countdown-timer';

jest.useFakeTimers();

describe('CountdownTimer', () => {
  const MS_IN_HOUR = 1000 * 60 * 60;
  const MS_IN_DAY = MS_IN_HOUR * 24;

  it('renders initial countdown correctly', () => {
    const launch = new Date(Date.now() + MS_IN_DAY * 1 + MS_IN_HOUR * 2 + 30 * 60 * 1000); // 1 day 2 hours 30 mins from now

    render(<CountdownTimer launch={launch} />);

    // Because of async useEffect and interval, trigger timer updates immediately
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // We expect days = 1, hours = 2 (minutes will be rounded down to 30 or less)
    expect(screen.getByText('01')).toBeInTheDocument(); // days
    expect(screen.getByText('02')).toBeInTheDocument(); // hours
    expect(screen.getByText('30')).toBeInTheDocument(); // minutes
  });

  it('counts down every second', () => {
    const launch = new Date(Date.now() + 5000); // 5 seconds from now

    render(<CountdownTimer launch={launch} />);

    // Initial render, seconds should be ~05
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(screen.getByText('05')).toBeInTheDocument();

    // After 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('04')).toBeInTheDocument();

    // After countdown ends, it should show zeros
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getAllByText('00').length).toBeGreaterThanOrEqual(4);
  });

  it('shows all zeros if launch is in the past', () => {
    const launch = new Date(Date.now() - MS_IN_DAY);

    render(<CountdownTimer launch={launch} />);

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getAllByText('00').length).toBeGreaterThanOrEqual(4);
  });
});
