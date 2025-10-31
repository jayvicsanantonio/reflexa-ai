import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createKeyboardHandler, trapFocus } from '../../utils/accessibility';
import type { Reflection, StreakData } from '../../types';
import { CalmStatsLite } from './CalmStatsLite';
// import { CalmStatsLite } from './CalmStatsLite';

interface DashboardModalProps {
  onClose: () => void;
}

interface SimpleStats {
  totalReflections: number;
  averagePerDay: number;
  totalReadingTime: number;
  totalReflectionTime: number;
  reflectionRatio: number; // 0..1
}

export const DashboardModal: React.FC<DashboardModalProps> = ({ onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [reflections, setReflections] = useState<Reflection[] | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const cleanup = trapFocus(contentRef.current, onClose);
    return cleanup;
  }, [onClose]);

  const handleKeyDown = createKeyboardHandler(onClose);

  useEffect(() => {
    void chrome.runtime
      .sendMessage({ type: 'load' })
      .then((resp: unknown) => {
        const r = resp as { success?: boolean; data?: unknown } | undefined;
        if (r?.success && Array.isArray(r.data)) {
          const items = (r.data as Reflection[])
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt);
          setReflections(items);
        } else {
          setReflections([]);
        }
      })
      .catch(() => setReflections([]));
    void chrome.runtime
      .sendMessage({ type: 'getStreak' })
      .then((resp: unknown) => {
        const r = resp as { success?: boolean; data?: unknown } | undefined;
        if (r?.success && r.data) setStreak(r.data as StreakData);
        else setStreak({ current: 0, lastReflectionDate: '' });
      })
      .catch(() => setStreak({ current: 0, lastReflectionDate: '' }));
  }, []);

  const stats: SimpleStats = useMemo(() => {
    const list = reflections ?? [];
    if (list.length === 0)
      return {
        totalReflections: 0,
        averagePerDay: 0,
        totalReadingTime: 0,
        totalReflectionTime: 0,
        reflectionRatio: 0,
      };
    const first = list[list.length - 1];
    const days = Math.max(
      1,
      Math.ceil((Date.now() - first.createdAt) / (1000 * 60 * 60 * 24))
    );
    // re-use heuristics from popup: 5 min reading, 3 min reflection
    const totalReading = list.length * 5 * 60;
    const totalReflect = list.length * 3 * 60;
    return {
      totalReflections: list.length,
      averagePerDay: list.length / days,
      totalReadingTime: totalReading,
      totalReflectionTime: totalReflect,
      reflectionRatio: totalReflect / (totalReading + totalReflect),
    };
  }, [reflections]);

  // formatTime helper no longer used (handled inside CalmStatsLite)

  // CalmStatsLite renders its own insight message; no helper needed here.

  const triggerDownload = (data: string, filename: string, type: string) => {
    try {
      const blob = new Blob([data], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // no-op
    }
  };

  const exportReflections = async (format: 'json' | 'markdown') => {
    try {
      const resp: unknown = await chrome.runtime.sendMessage({
        type: 'exportReflections',
        payload: format,
      });
      const r = resp as { success?: boolean; data?: string } | undefined;
      if (r?.success && typeof r.data === 'string') {
        const filename = `reflexa-reflections.${format === 'json' ? 'json' : 'md'}`;
        const mime =
          format === 'json'
            ? 'application/json;charset=utf-8'
            : 'text/markdown;charset=utf-8';
        triggerDownload(r.data, filename, mime);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const resp: unknown = await chrome.runtime.sendMessage({
        type: 'deleteReflection',
        payload: id,
      });
      const r = resp as { success?: boolean } | undefined;
      if (r?.success) {
        setReflections((prev) => (prev ?? []).filter((it) => it.id !== id));
        const sResp: unknown = await chrome.runtime.sendMessage({
          type: 'getStreak',
        });
        const s = sResp as { success?: boolean; data?: unknown } | undefined;
        if (s?.success && s.data) setStreak(s.data as StreakData);
      }
    } catch {
      // ignore
    }
  };

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 8px 20px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
            gap: 8,
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
                color: '#60a5fa',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={chrome.runtime.getURL('icons/reflexa.png')}
                alt=""
                width={22}
                height={22}
                style={{ borderRadius: 999 }}
              />
            </span>
            <div>
              <div
                id="reflexa-dashboard-title"
                style={{ fontSize: 18, fontWeight: 800 }}
              >
                Dashboard
              </div>
              <div style={{ color: '#334155', fontSize: 12 }}>
                Calm reflections, better focus
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => void exportReflections('json')}
              aria-label="Export as JSON"
              style={{
                padding: '6px 10px',
                border: '1px solid rgba(15,23,42,0.15)',
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => void exportReflections('markdown')}
              aria-label="Export as Markdown"
              style={{
                padding: '6px 10px',
                border: '1px solid rgba(15,23,42,0.15)',
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export MD
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="reflexa-modal__close"
              style={{ borderColor: 'rgba(15,23,42,0.15)', color: '#0f172a' }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', overflow: 'auto' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div
              style={{
                border: '1px solid rgba(15, 23, 42, 0.08)',
                borderRadius: 16,
                padding: 14,
                background: '#ffffff',
              }}
            >
              <div
                style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}
              >
                Daily Streak
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div
                  style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}
                >
                  {streak?.current ?? 0}
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {streak?.current === 1 ? 'day' : 'days'}
                </div>
              </div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
                Last: {streak?.lastReflectionDate ?? '—'}
              </div>
            </div>
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
            {reflections === null ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>Loading…</div>
            ) : reflections.length === 0 ? (
              <div
                style={{
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  borderRadius: 16,
                  padding: 16,
                  color: '#64748b',
                  background: '#ffffff',
                }}
              >
                No reflections yet. Start reading and Reflect.
              </div>
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {reflections.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    style={{
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                      borderRadius: 12,
                      padding: 12,
                      background: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: '#0f172a',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 420,
                        }}
                        title={r.title}
                      >
                        {r.title || 'Untitled'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleDeleteItem(r.id)}
                        title="Delete reflection"
                        aria-label={`Delete reflection ${r.title || ''}`}
                        style={{
                          width: 32,
                          height: 32,
                          border: '1px solid rgba(15,23,42,0.15)',
                          background: '#ffffff',
                          color: '#0f172a',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 12,
            }}
          >
            <button
              type="button"
              className="reflexa-btn reflexa-btn--ghost"
              onClick={() => {
                try {
                  const url = chrome.runtime.getURL('src/popup/index.html');
                  window.open(url, '_blank');
                } catch {
                  // no-op
                }
              }}
              style={{
                border: '1px solid rgba(15,23,42,0.15)',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              Open full dashboard
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '12px 20px 16px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid rgba(15, 23, 42, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="reflexa-btn reflexa-btn--primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
