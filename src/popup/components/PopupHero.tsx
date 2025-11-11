import React, { useCallback } from 'react';
import './PopupHero.css';

/**
 * Minimalist hero component for the popup
 * Provides a quick action to start reflection
 */
export const PopupHero: React.FC = () => {
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
  }, []);

  return (
    <div className="popup-hero-container" role="document">
      <div className="popup-hero-gradient-box">
        <div className="popup-hero-card">
          <img
            src={chrome.runtime.getURL('icons/reflexa.png')}
            alt="Reflexa AI"
            width={40}
            height={40}
            className="popup-hero-logo"
          />
          <div className="popup-hero-content">
            <div className="popup-hero-title" title="Reflexa AI">
              Reflexa AI
            </div>
            <div className="popup-hero-subtitle">Calm reflections, better focus</div>
          </div>

          <button
            type="button"
            onClick={handleReflectClick}
            aria-label="Start reflecting"
            className="popup-hero-button"
          >
            Reflect
          </button>
        </div>
      </div>
    </div>
  );
};
