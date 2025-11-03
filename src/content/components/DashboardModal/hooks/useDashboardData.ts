/**
 * useDashboardData Hook
 * Manages data fetching and deletion for dashboard
 */

import { useEffect, useState } from 'react';
import type { Reflection, StreakData } from '../../../../types';
import { devLog, devError } from '../../../../utils/logger';

export const useDashboardData = () => {
  const [reflections, setReflections] = useState<Reflection[] | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);

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

  const handleDeleteItem = async (id: string): Promise<void> => {
    devLog('[DashboardModal] Deleting reflection:', id);
    try {
      const resp: unknown = await chrome.runtime.sendMessage({
        type: 'deleteReflection',
        payload: id,
      });
      devLog('[DashboardModal] Delete response:', resp);
      const r = resp as { success?: boolean; error?: string } | undefined;
      if (r?.success) {
        devLog('[DashboardModal] Delete successful, updating UI');
        setReflections((prev) => (prev ?? []).filter((it) => it.id !== id));
        const sResp: unknown = await chrome.runtime.sendMessage({
          type: 'getStreak',
        });
        const s = sResp as { success?: boolean; data?: unknown } | undefined;
        if (s?.success && s.data) setStreak(s.data as StreakData);
      } else {
        devError('[DashboardModal] Delete failed:', r?.error);
      }
    } catch (error) {
      devError('[DashboardModal] Delete error:', error);
    }
  };

  return {
    reflections,
    streak,
    handleDeleteItem,
  };
};
