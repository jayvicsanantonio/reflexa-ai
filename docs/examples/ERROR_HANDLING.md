/**
 * Example: Using Custom Error Classes and Discriminated Union AIResponse
 *
 * This file demonstrates the improvements made to Task #2:
 * 1. Discriminated union for AIResponse (type-safe success/failure)
 * 2. Custom error classes for better error handling
 */

import type { AIResponse } from '../src/types';
import {
  AIUnavailableError,
  AITimeoutError,
  ContentTooLargeError,
  StorageFullError,
  NetworkError,
  ValidationError,
  isReflexaError,
  isRecoverableError,
  getErrorMessage,
  getErrorCode,
} from '../src/types/errors';

// ============================================================================
// Example 1: Discriminated Union AIResponse
// ============================================================================

/**
 * Before: AIResponse with optional fields (less type-safe)
 *
 * interface AIResponse {
 *   success: boolean;
 *   data?: unknown;
 *   error?: string;
 * }
 *
 * Problem: TypeScript doesn't know if data or error is present
 */

/**
 * After: Discriminated union (type-safe)
 *
 * type AIResponse<T = unknown> =
 *   | { success: true; data: T }
 *   | { success: false; error: string };
 *
 * Benefit: TypeScript knows exactly which fields are present
 */

// Example function that returns AIResponse
async function summarizeContent(
  content: string
): Promise<AIResponse<string[]>> {
  try {
    // Simulate AI processing
    if (content.length === 0) {
      return {
        success: false,
        error: 'Content is empty',
      };
    }

    const summary = ['Insight', 'Surprise', 'Apply'];
    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// Using the discriminated union (type-safe)
async function handleSummarize() {
  const response = await summarizeContent('Sample article content');

  // TypeScript knows the exact shape based on success value
  if (response.success) {
    // TypeScript knows: response.data exists and is string[]
    console.log('Summary:', response.data);
    response.data.forEach((bullet) => console.log(`- ${bullet}`));
    // response.error // ❌ TypeScript error: Property 'error' does not exist
  } else {
    // TypeScript knows: response.error exists and is string
    console.error('Error:', response.error);
    // response.data // ❌ TypeScript error: Property 'data' does not exist
  }
}

// ============================================================================
// Example 2: Custom Error Classes
// ============================================================================

/**
 * Before: String error messages (less structured)
 *
 * throw new Error('AI unavailable');
 *
 * Problem: No error codes, no metadata, hard to handle specific errors
 */

/**
 * After: Custom error classes (structured and type-safe)
 *
 * throw new AIUnavailableError();
 *
 * Benefits:
 * - Error codes for programmatic handling
 * - Metadata (duration, size, etc.)
 * - Recoverable flag for error handling strategy
 * - Type guards for error checking
 */

// Example: AI Service with custom errors
class AIService {
  async checkAvailability(): Promise<void> {
    const isAvailable = false; // Simulate unavailable

    if (!isAvailable) {
      throw new AIUnavailableError();
    }
  }

  async processWithTimeout(
    content: string,
    timeoutMs: number
  ): Promise<string> {
    const startTime = Date.now();

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const duration = Date.now() - startTime;
    if (duration > timeoutMs) {
      throw new AITimeoutError(undefined, duration);
    }

    return 'Processed content';
  }

  async processContent(content: string, maxTokens: number): Promise<string> {
    const estimatedTokens = content.length / 4; // Rough estimation

    if (estimatedTokens > maxTokens) {
      throw new ContentTooLargeError(undefined, estimatedTokens, maxTokens);
    }

    return 'Processed content';
  }
}

// Example: Storage Service with custom errors
class StorageService {
  async saveReflection(data: unknown): Promise<void> {
    const usedBytes = 4_500_000; // 4.5 MB
    const quotaBytes = 5_000_000; // 5 MB

    if (usedBytes >= quotaBytes) {
      throw new StorageFullError(undefined, usedBytes, quotaBytes);
    }

    // Save data...
  }

  async syncToCloud(data: unknown): Promise<void> {
    try {
      // Simulate network request
      throw new Error('Network timeout');
    } catch (error) {
      throw new NetworkError(undefined, error as Error);
    }
  }
}

// Example: Validation with custom errors
function validateSettings(settings: unknown): void {
  if (typeof settings !== 'object' || settings === null) {
    throw new ValidationError(
      'Settings must be an object',
      'settings',
      settings
    );
  }

  const { dwellThreshold } = settings as Record<string, unknown>;

  if (typeof dwellThreshold !== 'number') {
    throw new ValidationError(
      'dwellThreshold must be a number',
      'dwellThreshold',
      dwellThreshold
    );
  }

  // New validated range: 0–60 seconds (0 = instant)
  if (dwellThreshold < 0 || dwellThreshold > 60) {
    throw new ValidationError(
      'dwellThreshold must be between 0 and 60',
      'dwellThreshold',
      dwellThreshold
    );
  }
}

// ============================================================================
// Example 3: Error Handling with Type Guards
// ============================================================================

async function handleAIOperation() {
  const aiService = new AIService();

  try {
    await aiService.checkAvailability();
    const result = await aiService.processWithTimeout('content', 4000);
    console.log('Success:', result);
  } catch (error) {
    // Type guard: Check if it's a ReflexaError
    if (isReflexaError(error)) {
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Recoverable:', error.recoverable);

      // Handle specific error types
      if (error instanceof AIUnavailableError) {
        console.log('AI is unavailable, showing manual input option');
      } else if (error instanceof AITimeoutError) {
        console.log(`AI timed out after ${error.duration}ms`);
      } else if (error instanceof ContentTooLargeError) {
        console.log(
          `Content too large: ${error.actualSize} tokens (max: ${error.maxSize})`
        );
      }

      // Check if error is recoverable
      if (isRecoverableError(error)) {
        console.log('Error is recoverable, showing retry option');
      } else {
        console.log('Error is not recoverable, showing error message');
      }
    } else {
      // Handle non-ReflexaError
      console.error('Unexpected error:', getErrorMessage(error));
    }
  }
}

// ============================================================================
// Example 4: Centralized Error Handling
// ============================================================================

function handleError(error: unknown): {
  message: string;
  code: string;
  recoverable: boolean;
} {
  return {
    message: getErrorMessage(error),
    code: getErrorCode(error),
    recoverable: isRecoverableError(error),
  };
}

// Usage in UI components
async function uiHandleOperation() {
  try {
    // Some operation
    throw new AITimeoutError(undefined, 5000);
  } catch (error) {
    const { message, code, recoverable } = handleError(error);

    // Show error to user
    console.log('Error:', message);

    // Log error code for debugging
    console.log('Code:', code);

    // Show retry button if recoverable
    if (recoverable) {
      console.log('Showing retry button');
    }
  }
}

// ============================================================================
// Example 5: Combining AIResponse with Custom Errors
// ============================================================================

async function robustAIOperation(
  content: string
): Promise<AIResponse<string[]>> {
  try {
    const aiService = new AIService();

    // Check availability
    await aiService.checkAvailability();

    // Process content
    const result = await aiService.processContent(content, 3000);

    return {
      success: true,
      data: [result],
    };
  } catch (error) {
    // Convert error to AIResponse
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// Usage with full type safety
async function useRobustOperation() {
  const response = await robustAIOperation('Sample content');

  if (response.success) {
    // TypeScript knows: response.data is string[]
    console.log('Results:', response.data);
  } else {
    // TypeScript knows: response.error is string
    console.error('Error:', response.error);
  }
}

// ============================================================================
// Example 6: Error Recovery Strategies
// ============================================================================

async function operationWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Only retry if error is recoverable
      if (!isRecoverableError(error)) {
        throw error;
      }

      console.log(`Attempt ${attempt} failed, retrying...`);

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError;
}

// Usage
async function reliableOperation() {
  try {
    const result = await operationWithRetry(async () => {
      const aiService = new AIService();
      return await aiService.processWithTimeout('content', 4000);
    });

    console.log('Success:', result);
  } catch (error) {
    console.error('Failed after retries:', getErrorMessage(error));
  }
}

// ============================================================================
// Summary of Improvements
// ============================================================================

/**
 * 1. Discriminated Union AIResponse:
 *    - Type-safe success/failure handling
 *    - TypeScript knows exact shape based on success value
 *    - No need for optional chaining or type guards
 *    - Better IDE autocomplete
 *
 * 2. Custom Error Classes:
 *    - Structured error information (code, metadata)
 *    - Type-safe error handling with instanceof
 *    - Recoverable flag for error handling strategy
 *    - Type guards for error checking
 *    - Better error messages with context
 *
 * 3. Benefits:
 *    - Improved type safety throughout the codebase
 *    - Better error handling and recovery
 *    - Clearer error messages for users
 *    - Easier debugging with error codes
 *    - More maintainable error handling logic
 */

export {
  summarizeContent,
  handleSummarize,
  AIService,
  StorageService,
  validateSettings,
  handleAIOperation,
  handleError,
  robustAIOperation,
  operationWithRetry,
};
