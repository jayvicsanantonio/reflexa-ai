import React, { useEffect, useState } from 'react';

export interface SaveIndicatorProps {
  show: boolean;
  message?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  show,
  message = 'Settings saved',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="bg-accent-500 shadow-medium fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-white transition-all duration-300"
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
