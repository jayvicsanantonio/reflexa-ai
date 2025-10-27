import { useEffect } from 'react';

/**
 * Hook to detect keyboard navigation and add appropriate class to body
 * This helps distinguish between mouse and keyboard focus for better UX
 */
export const useKeyboardNavigation = (): void => {
  useEffect(() => {
    let isUsingKeyboard = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab key indicates keyboard navigation
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('keyboard-navigation-active');
      }
    };

    const handleMouseDown = () => {
      // Mouse click indicates mouse navigation
      if (isUsingKeyboard) {
        isUsingKeyboard = false;
        document.body.classList.remove('keyboard-navigation-active');
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      document.body.classList.remove('keyboard-navigation-active');
    };
  }, []);
};
