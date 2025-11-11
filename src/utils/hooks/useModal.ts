import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing modal state with keyboard shortcuts
 * @param onClose Optional callback when modal is closed
 * @returns [isOpen, open, close] tuple
 */
export function useModal(
  onClose?: () => void
): [boolean, () => void, () => void] {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  return [isOpen, open, close];
}
