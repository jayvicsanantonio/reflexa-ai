/**
 * DwellTracker - Monitors page visibility and user interaction to track dwell time
 *
 * This class tracks how long a user has been actively engaged with a page by:
 * - Monitoring page visibility using the Page Visibility API
 * - Detecting user interactions (scroll, mouse move, keyboard)
 * - Pausing the timer when the tab is hidden
 * - Notifying when the dwell threshold is reached
 */

export class DwellTracker {
  private dwellTime = 0; // Current dwell time in seconds
  private dwellThreshold = 60; // Threshold in seconds (loaded from settings)
  private isTracking = false;
  private isPageVisible = true;
  private lastActivityTime = Date.now();
  private intervalId: number | null = null;
  private thresholdCallback: (() => void) | null = null;
  private thresholdReached = false;

  // Activity detection settings
  private readonly ACTIVITY_TIMEOUT = 30000; // 30 seconds of inactivity pauses tracking
  private readonly TICK_INTERVAL = 1000; // Update every 1 second

  // Event handlers (bound to this instance)
  private boundHandleVisibilityChange: () => void;
  private boundHandleUserActivity: () => void;

  constructor(dwellThreshold = 60) {
    this.dwellThreshold = dwellThreshold;

    // Bind event handlers
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.boundHandleUserActivity = this.handleUserActivity.bind(this);
  }

  /**
   * Start tracking dwell time
   * Sets up event listeners and starts the timer
   */
  startTracking(): void {
    if (this.isTracking) {
      return; // Already tracking
    }

    this.isTracking = true;
    this.lastActivityTime = Date.now();
    this.isPageVisible = !document.hidden;

    // Set up Page Visibility API listener
    document.addEventListener(
      'visibilitychange',
      this.boundHandleVisibilityChange
    );

    // Set up user interaction listeners
    this.addActivityListeners();

    // Start the timer
    this.startTimer();
  }

  /**
   * Stop tracking dwell time
   * Removes event listeners and stops the timer
   */
  stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;

    // Remove Page Visibility API listener
    document.removeEventListener(
      'visibilitychange',
      this.boundHandleVisibilityChange
    );

    // Remove user interaction listeners
    this.removeActivityListeners();

    // Stop the timer
    this.stopTimer();
  }

  /**
   * Reset the dwell timer to zero
   * Used when navigating to a new page
   */
  reset(): void {
    this.dwellTime = 0;
    this.thresholdReached = false;
    this.lastActivityTime = Date.now();
  }

  /**
   * Get the current dwell time in seconds
   * @returns Current dwell time
   */
  getCurrentDwellTime(): number {
    return this.dwellTime;
  }

  /**
   * Register a callback to be invoked when the dwell threshold is reached
   * @param callback Function to call when threshold is reached
   */
  onThresholdReached(callback: () => void): void {
    this.thresholdCallback = callback;
  }

  /**
   * Update the dwell threshold
   * @param threshold New threshold in seconds
   */
  setDwellThreshold(threshold: number): void {
    this.dwellThreshold = threshold;
  }

  /**
   * Start the internal timer that increments dwell time
   */
  private startTimer(): void {
    if (this.intervalId !== null) {
      return; // Timer already running
    }

    this.intervalId = window.setInterval(() => {
      this.tick();
    }, this.TICK_INTERVAL);
  }

  /**
   * Stop the internal timer
   */
  private stopTimer(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Timer tick - increments dwell time if conditions are met
   */
  private tick(): void {
    // Only increment if page is visible and user is active
    if (this.shouldIncrementDwellTime()) {
      this.dwellTime += 1;

      // Check if threshold reached
      if (!this.thresholdReached && this.dwellTime >= this.dwellThreshold) {
        this.thresholdReached = true;
        this.notifyThresholdReached();
      }
    }
  }

  /**
   * Determine if dwell time should be incremented
   * @returns True if page is visible and user is active
   */
  private shouldIncrementDwellTime(): boolean {
    // Page must be visible
    if (!this.isPageVisible) {
      return false;
    }

    // User must have been active recently
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    if (timeSinceActivity > this.ACTIVITY_TIMEOUT) {
      return false;
    }

    return true;
  }

  /**
   * Handle page visibility changes
   * Pauses timer when tab is hidden
   */
  private handleVisibilityChange(): void {
    this.isPageVisible = !document.hidden;

    // If page becomes visible, update activity time
    if (this.isPageVisible) {
      this.lastActivityTime = Date.now();
    }
  }

  /**
   * Handle user activity events
   * Updates the last activity timestamp
   */
  private handleUserActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Add event listeners for user activity detection
   */
  private addActivityListeners(): void {
    // Scroll events
    window.addEventListener('scroll', this.boundHandleUserActivity, {
      passive: true,
    });

    // Mouse movement
    document.addEventListener('mousemove', this.boundHandleUserActivity, {
      passive: true,
    });

    // Keyboard events
    document.addEventListener('keydown', this.boundHandleUserActivity, {
      passive: true,
    });

    // Touch events for mobile
    document.addEventListener('touchstart', this.boundHandleUserActivity, {
      passive: true,
    });
    document.addEventListener('touchmove', this.boundHandleUserActivity, {
      passive: true,
    });
  }

  /**
   * Remove event listeners for user activity detection
   */
  private removeActivityListeners(): void {
    window.removeEventListener('scroll', this.boundHandleUserActivity);
    document.removeEventListener('mousemove', this.boundHandleUserActivity);
    document.removeEventListener('keydown', this.boundHandleUserActivity);
    document.removeEventListener('touchstart', this.boundHandleUserActivity);
    document.removeEventListener('touchmove', this.boundHandleUserActivity);
  }

  /**
   * Notify the registered callback that threshold has been reached
   */
  private notifyThresholdReached(): void {
    if (this.thresholdCallback) {
      this.thresholdCallback();
    }
  }

  /**
   * Clean up resources
   * Call this before destroying the instance
   */
  destroy(): void {
    this.stopTracking();
    this.thresholdCallback = null;
  }
}
