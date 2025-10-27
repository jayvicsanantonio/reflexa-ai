import React, { useEffect, useState } from 'react';
import type { StreakData } from '../types';
import { formatRelativeTime } from '../utils';

interface StreakCounterProps {
  streak: StreakData;
  onStreakIncrease?: () => void;
}

/**
 * StreakCounter Component
 * Displays the user's current reflection streak with a lotus icon
 * Animates when the streak increases
 */
const StreakCounterComponent: React.FC<StreakCounterProps> = ({
  streak,
  onStreakIncrease,
}) => {
  const [previousStreak, setPreviousStreak] = useState(streak.current);
  const [isAnimating, setIsAnimating] = useState(false);

  // Detect streak increase and trigger animation
  useEffect(() => {
    if (streak.current > previousStreak && previousStreak > 0) {
      setIsAnimating(true);
      onStreakIncrease?.();

      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);

      return () => clearTimeout(timer);
    }
    setPreviousStreak(streak.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak.current, previousStreak, onStreakIncrease]);

  // Format last reflection date
  const lastReflectionText = streak.lastReflectionDate
    ? formatRelativeTime(new Date(streak.lastReflectionDate).getTime())
    : 'No reflections yet';

  return (
    <div
      className="from-zen-500 to-zen-600 shadow-medium rounded-xl bg-linear-to-br p-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Current streak: ${streak.current} ${streak.current === 1 ? 'day' : 'days'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Lotus Icon */}
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300 ${
              isAnimating ? 'scale-110' : 'scale-100'
            }`}
          >
            <svg
              className={`h-8 w-8 text-white transition-transform duration-300 ${
                isAnimating ? 'rotate-12' : 'rotate-0'
              }`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Lotus flower icon */}
              <path d="M12 2C12 2 9 6 9 10C9 11.66 10.34 13 12 13C13.66 13 15 11.66 15 10C15 6 12 2 12 2Z" />
              <path d="M12 13C12 13 8 14 6 17C4.89 18.66 5.45 20.89 7.11 22C8.77 23.11 11 22.55 12.11 20.89C13 19.5 13 17 12 13Z" />
              <path d="M12 13C12 13 16 14 18 17C19.11 18.66 18.55 20.89 16.89 22C15.23 23.11 13 22.55 11.89 20.89C11 19.5 11 17 12 13Z" />
            </svg>
          </div>

          {/* Streak Info */}
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-display text-5xl font-bold text-white transition-all duration-300 ${
                  isAnimating ? 'scale-110' : 'scale-100'
                }`}
              >
                {streak.current}
              </span>
              <span className="font-sans text-lg font-medium text-white/80">
                {streak.current === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="font-sans text-sm font-medium text-white/70">
              Current Streak
            </p>
          </div>
        </div>

        {/* Celebration Badge (shown when streak increases) */}
        {isAnimating && (
          <div className="animate-fade-in absolute top-6 right-6">
            <div className="bg-lotus-400 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg">
              +1 🎉
            </div>
          </div>
        )}
      </div>

      {/* Last Reflection Date */}
      <div className="mt-4 border-t border-white/20 pt-4">
        <p className="font-sans text-sm text-white/70">
          Last reflection:{' '}
          <span className="font-medium text-white/90">
            {lastReflectionText}
          </span>
        </p>
      </div>

      {/* Motivational Message */}
      {streak.current > 0 && (
        <div className="mt-3">
          <p className="font-serif text-sm text-white/80 italic">
            {getMotivationalMessage(streak.current)}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Get motivational message based on streak count
 */
function getMotivationalMessage(streak: number): string {
  if (streak === 1) return 'Great start! Keep the momentum going.';
  if (streak < 7) return 'Building a beautiful habit, one day at a time.';
  if (streak < 14) return 'One week strong! Your mind thanks you.';
  if (streak < 30) return "Incredible consistency. You're on fire! 🔥";
  if (streak < 100) return 'A month of mindfulness. Truly inspiring.';
  return "Legendary dedication. You're a reflection master! ✨";
}

// Memoized export with custom comparison for optimal performance
export const StreakCounter = React.memo(
  StreakCounterComponent,
  (prevProps, nextProps) => {
    // Only re-render if streak data or callback changed
    return (
      prevProps.streak.current === nextProps.streak.current &&
      prevProps.streak.lastReflectionDate ===
        nextProps.streak.lastReflectionDate &&
      prevProps.onStreakIncrease === nextProps.onStreakIncrease
    );
  }
);
