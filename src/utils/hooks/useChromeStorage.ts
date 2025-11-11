import { useEffect, useState, useCallback } from 'react';

/**
 * Hook for managing Chrome storage with automatic synchronization
 * @param key Storage key to watch
 * @param defaultValue Default value if key doesn't exist
 * @returns [value, setValue, loading] tuple
 */
export function useChromeStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Load initial value
  useEffect(() => {
    const loadValue = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(key);
        setValue((result[key] as T) ?? defaultValue);
      } catch (error) {
        console.error(`Failed to load storage key "${key}":`, error);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    void loadValue();
  }, [key, defaultValue]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ): void => {
      if (areaName !== 'local' || !(key in changes)) return;

      const change = changes[key];
      if (change && 'newValue' in change && change.newValue !== undefined) {
        setValue(change.newValue as T);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key]);

  // Set value function
  const setStorageValue = useCallback(
    async (newValue: T): Promise<void> => {
      try {
        await chrome.storage.local.set({ [key]: newValue });
        setValue(newValue);
      } catch (error) {
        console.error(`Failed to set storage key "${key}":`, error);
        throw error;
      }
    },
    [key]
  );

  return [value, setStorageValue, loading];
}

/**
 * Hook for managing multiple Chrome storage keys
 * @param keys Array of storage keys to watch
 * @param defaultValues Default values for each key
 * @returns [values, setValue, loading] tuple
 */
export function useChromeStorageMulti<T extends Record<string, unknown>>(
  keys: (keyof T)[],
  defaultValues: T
): [T, (updates: Partial<T>) => Promise<void>, boolean] {
  const [values, setValues] = useState<T>(defaultValues);
  const [loading, setLoading] = useState(true);

  // Load initial values
  useEffect(() => {
    const loadValues = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(keys as string[]);
        const loadedValues = { ...defaultValues };
        for (const key of keys) {
          if (result[key as string] !== undefined) {
            loadedValues[key] = result[key as string] as T[keyof T];
          }
        }
        setValues(loadedValues);
      } catch (error) {
        console.error('Failed to load storage values:', error);
        setValues(defaultValues);
      } finally {
        setLoading(false);
      }
    };

    void loadValues();
  }, [keys, defaultValues]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ): void => {
      if (areaName !== 'local') return;

      let hasChanges = false;
      const updatedValues = { ...values };

      for (const key of keys) {
        if (key in changes) {
          const change = changes[key as string];
          if (change && 'newValue' in change && change.newValue !== undefined) {
            updatedValues[key] = change.newValue as T[keyof T];
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        setValues(updatedValues);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [keys, values]);

  // Set values function
  const setStorageValues = useCallback(
    async (updates: Partial<T>): Promise<void> => {
      try {
        await chrome.storage.local.set(updates as Record<string, unknown>);
        setValues((prev) => ({ ...prev, ...updates }));
      } catch (error) {
        console.error('Failed to set storage values:', error);
        throw error;
      }
    },
    []
  );

  return [values, setStorageValues, loading];
}
