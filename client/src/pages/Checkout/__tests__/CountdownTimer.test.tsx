import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { CountdownTimer } from '../CountdownTimer';

describe('CountdownTimer Component (7-Minute Industry Standard)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders default 7 minutes (420 seconds) as 07:00', () => {
    render(<CountdownTimer />);
    expect(screen.getByText('07:00')).toBeInTheDocument();
    expect(screen.getByText(/Thời gian giữ ghế còn lại/i)).toBeInTheDocument();
  });

  it('ticks down correctly over time', () => {
    render(<CountdownTimer initialSeconds={420} />);
    expect(screen.getByText('07:00')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000); // 10 seconds pass
    });

    expect(screen.getByText('06:50')).toBeInTheDocument();
  });

  it('displays urgent amber state when time is under 2 minutes (119 seconds)', () => {
    render(<CountdownTimer initialSeconds={119} />);
    expect(screen.getByText('01:59')).toBeInTheDocument();

    const container = screen.getByText('01:59').closest('div')?.parentElement;
    expect(container?.className).toContain('bg-amber-50');
  });

  it('triggers critical red state when time is under 1 minute (59 seconds)', () => {
    render(<CountdownTimer initialSeconds={59} />);
    expect(screen.getByText('00:59')).toBeInTheDocument();

    const container = screen.getByText('00:59').closest('div')?.parentElement;
    expect(container?.className).toContain('bg-rose-50');
  });

  it('calls onExpire callback when timer reaches zero', () => {
    const onExpireMock = vi.fn();
    render(<CountdownTimer initialSeconds={2} onExpire={onExpireMock} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onExpireMock).toHaveBeenCalledTimes(1);
  });
});
