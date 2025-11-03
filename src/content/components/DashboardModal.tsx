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
      className="fixed inset-0 z-[2147483646] flex animate-[fadeIn_0.3s_ease-in-out] items-center justify-center font-sans motion-reduce:animate-[fadeIn_0.15s_ease-in-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflexa-dashboard-title"
    >
      <div
        className="-webkit-backdrop-blur-[6px] absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        ref={contentRef}
        className="relative z-[1] flex max-h-[84vh] min-h-0 w-[92vw] animate-[reflexaPopIn_220ms_cubic-bezier(0.2,0.8,0.2,1)] flex-col overflow-hidden rounded-3xl border border-slate-900/8 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.25)] min-[760px]:w-[760px] min-[780px]:max-h-[780px]"
        onKeyDown={handleKeyDown}
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
