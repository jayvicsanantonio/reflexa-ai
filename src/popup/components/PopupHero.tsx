/**
 * Minimalist hero component for the popup toolbar
 * Provides a quick action to start reflection
 */

import React, { useCallback } from 'react';

interface PopupHeroProps {
  onReflectClick?: () => void;
}

/**
 * Hero component for the popup - minimalist design with quick action
 * Memoized to prevent unnecessary re-renders
 */
const PopupHeroComponent: React.FC<PopupHeroProps> = ({ onReflectClick }) => {
  const handleReflectClick = useCallback(() => {
    // Close popup immediately for better UX
    window.close();

    // Send message to start reflection (fire and forget)
    chrome.runtime
      .sendMessage({
        type: 'startReflectInActiveTab',
      })
      .catch(() => {
        // Popup is already closed, nothing to do
      });

    onReflectClick?.();
  }, [onReflectClick]);

  // Match pulsing lotus gradient (zen palette)
  const bgGradient =
    'linear-gradient(135deg, var(--color-zen-500, #0ea5e9) 0%, var(--color-zen-600, #0284c7) 100%)';

  return (
    <div
      role="document"
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
    >
      {/* Compact outer gradient box matching lotus vibe */}
      <div
        style={{
          position: 'relative',
          width: 'min(460px, 96%)',
          height: 120,
          background: bgGradient,
          borderRadius: 20,
          boxShadow: '0 12px 30px rgba(2,8,23,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10,
        }}
      >
        {/* Inner white pill card */}
        <div
          style={{
            position: 'relative',
            width: 'min(440px, 95%)',
            borderRadius: 9999,
            background: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 10px 28px rgba(2,8,23,0.14)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <img
            src={chrome.runtime.getURL('icons/reflexa.png')}
            alt="Reflexa AI"
            width={40}
            height={40}
            style={{ borderRadius: 999, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#0f172a',
                fontWeight: 800,
                fontSize: 18,
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title="Reflexa AI"
            >
              Reflexa AI
            </div>
            <div style={{ color: '#334155', fontSize: 12 }}>
              Calm reflections, better focus
            </div>
          </div>

          <button
            type="button"
            onClick={handleReflectClick}
            aria-label="Start reflecting"
            style={{
              border: '1px solid rgba(15,23,42,0.12)',
              color: '#0f172a',
              background: '#ffffff',
              borderRadius: 999,
              padding: '10px 18px',
              fontWeight: 900,
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(2,8,23,0.08)',
            }}
          >
            Reflect
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoized export to prevent unnecessary re-renders
export const PopupHero = React.memo(PopupHeroComponent);
