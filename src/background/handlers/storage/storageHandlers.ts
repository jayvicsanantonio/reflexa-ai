/**
 * Storage operation handlers
 * Handles all storage-related operations: save, load, delete, export, getStreak
 */

import { StorageManager } from '../../services/storage';
import { createSuccessResponse, createErrorResponse } from '../../../types';
import type { AIResponse, Reflection, StreakData } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';
import { devLog, devWarn, devError } from '../../../utils/logger';

const storageManager = new StorageManager();

/**
 * Handle save reflection request
 */
export async function handleSave(payload: unknown): Promise<AIResponse<void>> {
  const startTime = Date.now();

  try {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      devError('[Save] Invalid payload:', typeof payload);
      return createErrorResponse(
        'Invalid reflection data',
        Date.now() - startTime,
        'storage'
      );
    }

    const reflection = payload as Reflection;

    // Validate required fields
    if (!reflection.url || !reflection.title || !reflection.createdAt) {
      devError('[Save] Missing required fields:', reflection);
      return createErrorResponse(
        'Missing required reflection fields',
        Date.now() - startTime,
        'storage'
      );
    }

    // Check storage quota before saving
    const isNearLimit = await storageManager.isStorageNearLimit();
    if (isNearLimit) {
      devWarn('[Save] Storage near limit (>90%)');
    }

    // Save reflection using storage manager
    devLog('[Save] Saving reflection...');
    await storageManager.saveReflection(reflection);
    const duration = Date.now() - startTime;

    devLog(`[Save] Success in ${duration}ms`);
    return createSuccessResponse(undefined as void, 'storage', duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    devError(`[Save] Error after ${duration}ms:`, error);

    // Check if it's a storage full error
    if (
      error instanceof Error &&
      (error.message.includes('storage') ||
        error.message.includes('QUOTA') ||
        error.name === 'StorageFullError')
    ) {
      devError('[Save] Storage quota exceeded');
      return createErrorResponse(
        ERROR_MESSAGES.STORAGE_FULL,
        duration,
        'storage'
      );
    }

    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      duration,
      'storage'
    );
  }
}

/**
 * Handle load reflections request
 */
export async function handleLoad(
  payload: unknown
): Promise<AIResponse<Reflection[]>> {
  const startTime = Date.now();
  try {
    // Parse limit if provided
    const limit =
      typeof payload === 'number' && payload > 0 ? payload : undefined;

    // Load reflections using storage manager
    const reflections = await storageManager.getReflections(limit);

    return createSuccessResponse(
      reflections,
      'storage',
      Date.now() - startTime
    );
  } catch (error) {
    devError('Error in handleLoad:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Handle get streak request
 */
export async function handleGetStreak(): Promise<AIResponse<StreakData>> {
  const startTime = Date.now();
  try {
    const streak = await storageManager.getStreak();
    return createSuccessResponse(streak, 'storage', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Delete a reflection by ID and update streak
 */
export async function handleDeleteReflection(
  payload: unknown
): Promise<AIResponse<boolean>> {
  const startTime = Date.now();
  try {
    if (!payload || typeof payload !== 'string') {
      return createErrorResponse(
        'Invalid reflection id',
        Date.now() - startTime,
        'storage'
      );
    }
    await storageManager.deleteReflection(payload);
    return createSuccessResponse(true, 'storage', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}

/**
 * Export reflections in given format
 */
export async function handleExportReflections(
  payload: unknown
): Promise<AIResponse<string>> {
  const startTime = Date.now();
  try {
    const format = payload === 'markdown' ? 'markdown' : 'json';
    const data = await storageManager.exportReflections(format);
    return createSuccessResponse(data, 'storage', Date.now() - startTime);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
      Date.now() - startTime,
      'storage'
    );
  }
}
