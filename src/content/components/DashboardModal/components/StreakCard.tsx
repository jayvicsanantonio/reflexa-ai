/**
 * Streak Card Component
 * Displays daily streak with weekly progress
 */

import React from 'react';
import type { StreakData } from '../../../../types';
import { IconFlame } from '../icons';

interface StreakCardProps {
  streak: StreakData | null;
}

export const StreakCard: React.FC<StreakCardProps> = ({ streak }) => {
  const currentStreak = streak?.current ?? 0;
  const weeklyProgress = Math.min(currentStreak, 7);

  return (
    <div
      style={{
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: 16,
        padding: 14,
        background: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'rgba(59,130,246,0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
          }}
        >
          {IconFlame}
        </span>
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>Daily Streak</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            Keep the rhythm of reflection
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginTop: 12,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a' }}>
          {currentStreak}
        </div>
        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>
          {currentStreak === 1 ? 'day' : 'days'}
        </div>
      </div>

      {/* Weekly progress bar (out of 7) */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span style={{ color: '#334155', fontSize: 12, fontWeight: 600 }}>
            This week
          </span>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            {weeklyProgress} / 7
          </span>
        </div>
        <div
          aria-label="Weekly streak progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={7}
          aria-valuenow={weeklyProgress}
          style={{
            height: 10,
            background: '#e2e8f0',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${(weeklyProgress / 7) * 100}%`,
              background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
              height: '100%',
            }}
          />
        </div>
      </div>

      {/* Mini badges row (7 slots) */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const filled = i < weeklyProgress;
          return (
            <span
              key={i}
              aria-hidden
              title={filled ? 'Completed' : 'Pending'}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: filled ? '#60a5fa' : '#e2e8f0',
                border: filled
                  ? '1px solid rgba(30,64,175,0.2)'
                  : '1px solid rgba(15,23,42,0.08)',
                display: 'inline-block',
              }}
            />
          );
        })}
      </div>

      <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>
        Last reflection: {streak?.lastReflectionDate ?? '—'}
      </div>
    </div>
  );
};
