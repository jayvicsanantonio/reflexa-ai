/**
 * Unit tests for DwellTracker
 * Tests dwell time calculation and reset logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DwellTracker } from './dwellTracker';

describe('DwellTracker', () => {
  let tracker: DwellTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new DwellTracker(60);
  });

  afterEach(() => {
    tracker.destroy();
    vi.useRealTimers();
  });

  describe('startTracking', () => {
    it('should start tracking dwell time', () => {
      tracker.startTracking();
      expect(tracker.getCurrentDwellTime()).toBe(0);

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);
      expect(tracker.getCurrentDwellTime()).toBe(5);
    });

    it('should not restart if already tracking', () => {
      tracker.startTracking();
      vi.advanceTimersByTime(3000);

      tracker.startTracking(); // Try to start again
      expect(tracker.getCurrentDwellTime()).toBe(3);
    });
  });

  describe('stopTracking', () => {
    it('should stop incrementing dwell time', () => {
      tracker.startTracking();
      vi.advanceTimersByTime(5000);
      expect(tracker.getCurrentDwellTime()).toBe(5);

      tracker.stopTracking();
      vi.advanceTimersByTime(5000);
      expect(tracker.getCurrentDwellTime()).toBe(5); // Should not increase
    });
  });

  describe('reset', () => {
    it('should reset dwell time to zero', () => {
      tracker.startTracking();
      vi.advanceTimersByTime(10000);
      expect(tracker.getCurrentDwellTime()).toBe(10);

      tracker.reset();
      expect(tracker.getCurrentDwellTime()).toBe(0);
    });

    it('should allow threshold to be reached again after reset', () => {
      const callback = vi.fn();
      tracker.onThresholdReached(callback);
      tracker.startTracking();

      // Simulate user activity every 10 seconds to keep tracking active
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(10000);
        document.dispatchEvent(new Event('mousemove'));
      }
      expect(callback).toHaveBeenCalledTimes(1);

      // Reset and reach threshold again
      tracker.reset();
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(10000);
        document.dispatchEvent(new Event('mousemove'));
      }
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('threshold callback', () => {
    it('should call callback when threshold is reached', () => {
      const callback = vi.fn();
      tracker.onThresholdReached(callback);
      tracker.startTracking();

      // Simulate user activity every 10 seconds to keep tracking active
      for (let i = 0; i < 6; i++) {
        document.dispatchEvent(new Event('mousemove'));
        vi.advanceTimersByTime(10000);
      }

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should only call callback once per threshold', () => {
      const callback = vi.fn();
      tracker.onThresholdReached(callback);
      tracker.startTracking();

      // Simulate user activity every 10 seconds to keep tracking active
      for (let i = 0; i < 7; i++) {
        document.dispatchEvent(new Event('mousemove'));
        vi.advanceTimersByTime(10000);
      }

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('setDwellThreshold', () => {
    it('should update the dwell threshold', () => {
      const callback = vi.fn();
      tracker.onThresholdReached(callback);
      tracker.setDwellThreshold(30);
      tracker.startTracking();

      vi.advanceTimersByTime(30000);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('page visibility', () => {
    it('should pause tracking when page is hidden', () => {
      tracker.startTracking();
      vi.advanceTimersByTime(5000);
      expect(tracker.getCurrentDwellTime()).toBe(5);

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      vi.advanceTimersByTime(5000);
      expect(tracker.getCurrentDwellTime()).toBe(5); // Should not increase
    });

    it('should resume tracking when page becomes visible', () => {
      tracker.startTracking();

      // Hide page
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(5000);
      expect(tracker.getCurrentDwellTime()).toBe(0);

      // Show page
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(5000);
      expect(tracker.getCurrentDwellTime()).toBe(5);
    });
  });

  describe('getCurrentDwellTime', () => {
    it('should return current dwell time in seconds', () => {
      tracker.startTracking();
      expect(tracker.getCurrentDwellTime()).toBe(0);

      vi.advanceTimersByTime(15000);
      expect(tracker.getCurrentDwellTime()).toBe(15);
    });
  });
});
