/**
 * Export Utilities
 * Helper functions for exporting reflections
 */

export const triggerDownload = (
  data: string,
  filename: string,
  type: string
): void => {
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

export const exportReflections = async (
  format: 'json' | 'markdown'
): Promise<void> => {
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
