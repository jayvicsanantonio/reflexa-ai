/**
 * Accessibility Tests for Reflexa AI Chrome Extension
 * Tests keyboard navigation, screen reader support, color contrast,
 * focus management, and reduced motion preferences
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  trapFocus,
  announceToScreenReader,
  meetsContrastRequirement,
  getContrastRatio,
  prefersReducedMotion,
  createKeyboardHandler,
  getAccessibleDuration,
  cleanupAllAnnouncements,
} from './accessibility';
import { MeditationFlowOverlay, LotusNudge } from '../content/components';
import type { Settings } from '../types';

describe('Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    it('should handle Enter key press', () => {
      const onClick = vi.fn();
      const handler = createKeyboardHandler(onClick);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalled();
    });

    it('should handle Space key press', () => {
      const onClick = vi.fn();
      const handler = createKeyboardHandler(onClick);
      const event = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalled();
    });

    it('should not trigger on other keys', () => {
      const onClick = vi.fn();
      const handler = createKeyboardHandler(onClick);
      const event = {
        key: 'a',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      handler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should trap focus within container', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');

      button1.textContent = 'First';
      button2.textContent = 'Second';
      button3.textContent = 'Third';

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      const cleanup = trapFocus(container);

      expect(document.activeElement).toBe(button1);

      button3.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      container.dispatchEvent(tabEvent);

      waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      cleanup();
    });

    it('should handle Escape key with callback', () => {
      const onEscape = vi.fn();
      const button = document.createElement('button');
      container.appendChild(button);

      trapFocus(container, onEscape);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      container.dispatchEvent(escapeEvent);

      expect(onEscape).toHaveBeenCalled();
    });

    it('should handle Shift+Tab for reverse navigation', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      container.appendChild(button1);
      container.appendChild(button2);

      trapFocus(container);

      button1.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      container.dispatchEvent(shiftTabEvent);

      waitFor(() => {
        expect(document.activeElement).toBe(button2);
      });
    });
  });

  describe('Screen Reader Announcements', () => {
    afterEach(() => {
      cleanupAllAnnouncements();
    });

    it('should create announcement element with correct attributes', () => {
      announceToScreenReader('Test message', 'polite');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
      expect(announcement).toHaveTextContent('Test message');
    });

    it('should support assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toHaveAttribute('aria-live', 'assertive');
    });

    it('should return cleanup function', () => {
      const cleanup = announceToScreenReader('Test', 'polite');

      let announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeInTheDocument();

      cleanup();

      announcement = document.querySelector('[role="status"]');
      expect(announcement).not.toBeInTheDocument();
    });

    it('should auto-remove announcement after timeout', async () => {
      announceToScreenReader('Test', 'polite');

      let announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeInTheDocument();

      await waitFor(
        () => {
          announcement = document.querySelector('[role="status"]');
          expect(announcement).not.toBeInTheDocument();
        },
        { timeout: 1500 }
      );
    });
  });

  describe('Color Contrast', () => {
    it('should pass WCAG AA for dark text on light background', () => {
      expect(meetsContrastRequirement('#0f172a', '#f8fafc')).toBe(true);
    });

    it('should pass WCAG AA for light text on dark background', () => {
      expect(meetsContrastRequirement('#f8fafc', '#0f172a')).toBe(true);
    });

    it('should check button text contrast ratio', () => {
      const ratio = getContrastRatio('#ffffff', '#0ea5e9');
      expect(ratio).toBeCloseTo(2.77, 1);
    });

    it('should check link text contrast ratio', () => {
      const ratio = getContrastRatio('#0284c7', '#ffffff');
      expect(ratio).toBeGreaterThan(3);
    });

    it('should fail for insufficient contrast', () => {
      expect(meetsContrastRequirement('#e0e0e0', '#ffffff')).toBe(false);
    });

    it('should calculate correct contrast ratio', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should handle RGB color format', () => {
      expect(
        meetsContrastRequirement('rgb(15, 23, 42)', 'rgb(248, 250, 252)')
      ).toBe(true);
    });

    it('should handle RGBA color format', () => {
      expect(
        meetsContrastRequirement(
          'rgba(15, 23, 42, 1)',
          'rgba(248, 250, 252, 1)'
        )
      ).toBe(true);
    });

    it('should handle HSL color format', () => {
      expect(
        meetsContrastRequirement('hsl(222, 47%, 11%)', 'hsl(210, 40%, 98%)')
      ).toBe(true);
    });

    it('should handle short hex format', () => {
      expect(meetsContrastRequirement('#000', '#fff')).toBe(true);
    });
  });

  describe('Reduced Motion', () => {
    it('should detect prefers-reduced-motion', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return false when reduced motion not preferred', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('Accessible Duration Formatting', () => {
    it('should format seconds correctly', () => {
      expect(getAccessibleDuration(30)).toBe('30 seconds');
      expect(getAccessibleDuration(45)).toBe('45 seconds');
    });

    it('should format minutes correctly', () => {
      expect(getAccessibleDuration(60)).toBe('1 minute');
      expect(getAccessibleDuration(120)).toBe('2 minutes');
      expect(getAccessibleDuration(300)).toBe('5 minutes');
    });

    it('should format minutes and seconds correctly', () => {
      expect(getAccessibleDuration(90)).toBe('1 minute and 30 seconds');
      expect(getAccessibleDuration(150)).toBe('2 minutes and 30 seconds');
      expect(getAccessibleDuration(61)).toBe('1 minute and 1 second');
    });
  });

  describe('Component Accessibility', () => {
    describe('LotusNudge', () => {
      it('should have correct ARIA attributes', () => {
        const onClick = vi.fn();
        render(<LotusNudge onClick={onClick} visible={true} />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('tabIndex', '0');
      });

      it('should respond to Enter key', () => {
        const onClick = vi.fn();
        render(<LotusNudge onClick={onClick} visible={true} />);

        const button = screen.getByRole('button');
        fireEvent.keyDown(button, { key: 'Enter' });

        expect(onClick).toHaveBeenCalled();
      });

      it('should respond to Space key', () => {
        const onClick = vi.fn();
        render(<LotusNudge onClick={onClick} visible={true} />);

        const button = screen.getByRole('button');
        fireEvent.keyDown(button, { key: ' ' });

        expect(onClick).toHaveBeenCalled();
      });

      it('should have aria-hidden on decorative SVG', () => {
        const onClick = vi.fn();
        render(<LotusNudge onClick={onClick} visible={true} />);

        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    describe('MeditationFlowOverlay', () => {
      const defaultSettings: Settings = {
        dwellThreshold: 30,
        enableSound: true,
        reduceMotion: false,
        proofreadEnabled: true,
        privacyMode: 'local',
        useNativeSummarizer: false,
        useNativeProofreader: false,
        translationEnabled: false,
        targetLanguage: 'en',
        defaultSummaryFormat: 'bullets',
        enableProofreading: true,
        enableTranslation: false,
        preferredTranslationLanguage: 'en',
        experimentalMode: false,
        autoDetectLanguage: true,
      };

      const defaultProps = {
        summary: ['Insight text', 'Surprise text', 'Apply text'],
        prompts: ['Question 1?', 'Question 2?'],
        onSave: vi.fn(),
        onCancel: vi.fn(),
        settings: defaultSettings,
      };

      it('should have dialog role and aria-modal', () => {
        render(<MeditationFlowOverlay {...defaultProps} />);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-label', 'Meditation Reflect');
      });

      it('should respond to Escape key', () => {
        const onCancel = vi.fn();
        const { container } = render(
          <MeditationFlowOverlay {...defaultProps} onCancel={onCancel} />
        );

        const overlay = container.querySelector('.reflexa-overlay');
        if (overlay) {
          fireEvent.keyDown(overlay, { key: 'Escape' });
        }

        expect(onCancel).toHaveBeenCalled();
      });
    });
  });
});
