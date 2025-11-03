import React, { useEffect, useRef } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import { CalmStatsLite } from './CalmStatsLite';
import {
  ModalHeader,
  ModalFooter,
  StreakCard,
  ReflectionsList,
} from './DashboardModal/components';
import { useDashboardData, useStats } from './DashboardModal/hooks';

interface DashboardModalProps {
  onClose: () => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({ onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { reflections, streak, handleDeleteItem } = useDashboardData();
  const stats = useStats(reflections);

  useEffect(() => {
    if (!contentRef.current) return;
    const cleanup = trapFocus(contentRef.current, onClose);
    return cleanup;
  }, [onClose]);

  const handleKeyDown = createKeyboardHandler(onClose);

  return (
    <div
      className="reflexa-error-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-dashboard-title"
    >
      <div className="reflexa-error-modal__backdrop" onClick={onClose} />
      <div
        ref={contentRef}
        className="reflexa-modal-animate"
        onKeyDown={handleKeyDown}
        style={{
          width: 'min(760px, 92vw)',
          maxHeight: 'min(84vh, 780px)',
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <ModalHeader onClose={onClose} />

        <div style={{ padding: '16px 20px', overflow: 'auto' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <StreakCard streak={streak} />
            <CalmStatsLite
              stats={{
                totalReflections: stats.totalReflections,
                averagePerDay: stats.averagePerDay,
                totalReadingTime: stats.totalReadingTime,
                totalReflectionTime: stats.totalReflectionTime,
                reflectionRatio: stats.reflectionRatio,
              }}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Recent Reflections
            </div>
            <ReflectionsList
              reflections={reflections}
              onDelete={handleDeleteItem}
            />
          </div>
        </div>

        <ModalFooter onClose={onClose} />
      </div>
    </div>
  );
};
