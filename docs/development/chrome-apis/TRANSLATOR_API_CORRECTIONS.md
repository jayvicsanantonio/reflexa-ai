# Translator API Integration Corrections

## Date: January 27, 2025

## Critical Issues Found

### ❌ Issue 1: Incorrect API Access Pattern

**Current Implementation (WRONG):**

```typescript
// ❌ Using ai.translator - This doesn't exist!
if (typeof ai === 'undefined' || !ai?.translator) {
  console.warn('Translator API not available');
  return null;
}
return ai.translator;
```

**Correct Implementation:**

```typescript
// ✅ Global Translator object (capital T)
if (typeof Translator === 'undefined') {
  console.warn('Translator API not available');
  return null;
}
```

**Source:** https://developer.chrome.com/docs/ai/translator-api

The Translator API is accessed via a **global `Translator` object**, NOT through `ai.translator`.

---

### ❌ Issue 2: Incorrect `create()` Method Signature

**Current Implementation (WRONG):**

```typescript
// ❌ Two separate parameters
const session = await factory.create(sourceLanguage, targetLanguage);
```

**Correct Implementation:**

```typescript
// ✅ Options object with sourceLanguage and targetLanguage
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

---

### ❌ Issue 3: Incorrect Availability Check

**Current Implementation (WRONG):**

```typescript
// ❌ Using canTranslate() method
const availability = await factory.canTranslate(sourceLanguage, targetLanguage);
return availability === 'available';
```

**Correct Implementation:**

```typescript
// ✅ Using availability() with options
const status = await Translator.availability({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
});
// Returns: 'available' | 'downloadable' | 'downloading' | 'unavailable'
```

---

### ✅ What's Correct

1. **Streaming implementation** - `translateStreaming()` usage is correct
2. **Session caching** - Good practice for performance
3. **Timeout and retry logic** - Well implemented
4. **Markdown preservation** - Nice feature addition

---

## Corrected Implementation

```typescript
/**
 * Translator Manager for Chrome Built-in Translator API
 * Handles text translation between languages with session management
 */

import type { AITranslator } from '../types/chrome-ai';
import { capabilityDetector } from './capabilityDetector';

const TRANSLATE_TIMEOUT = 5000;
const RETRY_TIMEOUT = 8000;

export const SUPPORTED_LANGUAGES = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'zh',
  'ja',
  'ko',
  'ar',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

interface TranslationSession {
  session: AITranslator;
  sourceLanguage: string;
  targetLanguage: string;
  lastUsed: number;
}

export class TranslatorManager {
  private sessions = new Map<string, TranslationSession>();
  private available = false;
  private readonly SESSION_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if Translator API is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const capabilities = await Promise.resolve(
        capabilityDetector.getCapabilities()
      );
      this.available = Boolean(capabilities.translator);
      return this.available;
    } catch (error) {
      console.error('Error checking Translator availability:', error);
      this.available = false;
      return false;
    }
  }

  /**
   * Check if Translator API is available (synchronous)
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Check if translation is available for a specific language pair
   * @param sourceLanguage - Source language ISO 639-1 code
   * @param targetLanguage - Target language ISO 639-1 code
   * @returns Promise resolving to availability status
   */
  async canTranslate(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean> {
    try {
      // ✅ CORRECT - Use global Translator object
      if (typeof Translator === 'undefined') {
        return false;
      }

      const status = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      return status === 'available' || status === 'downloadable';
    } catch (error) {
      console.error(
        `Error checking translation availability for ${sourceLanguage} -> ${targetLanguage}:`,
        error
      );
      return false;
    }
  }

  /**
   * Create or retrieve a translation session for a language pair
   */
  private async createSession(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<AITranslator | null> {
    const sessionKey = `${sourceLanguage}-${targetLanguage}`;

    // Check for existing session
    const existing = this.sessions.get(sessionKey);
    if (existing) {
      const now = Date.now();
      if (now - existing.lastUsed < this.SESSION_TTL) {
        existing.lastUsed = now;
        return existing.session;
      } else {
        // Session expired, clean it up
        try {
          existing.session.destroy();
        } catch (error) {
          console.error('Error destroying expired session:', error);
        }
        this.sessions.delete(sessionKey);
      }
    }

    try {
      // ✅ CORRECT - Use global Translator object
      if (typeof Translator === 'undefined') {
        return null;
      }

      // ✅ CORRECT - Use options object
      const session = await Translator.create({
        sourceLanguage,
        targetLanguage,
      });

      // Cache the session
      this.sessions.set(sessionKey, {
        session,
        sourceLanguage,
        targetLanguage,
        lastUsed: Date.now(),
      });

      console.log(`Created translator session: ${sessionKey}`);

      return session;
    } catch (error) {
      console.error(
        `Error creating translator session for ${sessionKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Translate text from source language to target language
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    // Check availability first
    if (!this.available) {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        throw new Error('Translator API is not available');
      }
    }

    if (!sourceLanguage) {
      throw new Error(
        'Source language must be provided. Auto-detection requires Language Detector API integration.'
      );
    }

    // Validate language pair availability
    const canTranslate = await this.canTranslate(
      sourceLanguage,
      targetLanguage
    );
    if (!canTranslate) {
      throw new Error(
        `Translation not available for ${sourceLanguage} -> ${targetLanguage}`
      );
    }

    try {
      return await this.translateWithTimeout(
        text,
        sourceLanguage,
        targetLanguage,
        TRANSLATE_TIMEOUT
      );
    } catch (error) {
      console.warn('First translation attempt failed, retrying...', error);

      try {
        return await this.translateWithTimeout(
          text,
          sourceLanguage,
          targetLanguage,
          RETRY_TIMEOUT
        );
      } catch (retryError) {
        console.error('Translation failed after retry:', retryError);
        throw new Error(
          `Translation failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        );
      }
    }
  }

  private async translateWithTimeout(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    timeout: number
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Translation timeout')), timeout);
    });

    const translatePromise = this.executeTranslate(
      text,
      sourceLanguage,
      targetLanguage
    );

    return Promise.race([translatePromise, timeoutPromise]);
  }

  private async executeTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    const session = await this.createSession(sourceLanguage, targetLanguage);

    if (!session) {
      throw new Error('Failed to create translator session');
    }

    try {
      const hasMarkdown = this.detectMarkdown(text);

      if (hasMarkdown) {
        return await this.translateWithMarkdown(session, text);
      } else {
        const result = await session.translate(text);
        return result.trim();
      }
    } catch (error) {
      console.error('Translation execution failed:', error);
      throw error;
    }
  }

  private detectMarkdown(text: string): boolean {
    const markdownPatterns = [
      /^[-*+]\s+/m,
      /^\d+\.\s+/m,
      /^#{1,6}\s+/m,
      /\*\*.*\*\*/m,
      /\*.*\*/m,
      /\[.*\]\(.*\)/m,
    ];

    return markdownPatterns.some((pattern) => pattern.test(text));
  }

  private async translateWithMarkdown(
    session: AITranslator,
    text: string
  ): Promise<string> {
    const lines = text.split('\n');
    const translatedLines: string[] = [];

    for (const line of lines) {
      if (line.trim().length === 0) {
        translatedLines.push('');
        continue;
      }

      const bulletMatch = /^([-*+]\s+)(.*)/.exec(line);
      const numberedMatch = /^(\d+\.\s+)(.*)/.exec(line);
      const headerMatch = /^(#{1,6}\s+)(.*)/.exec(line);

      if (bulletMatch) {
        const [, marker, content] = bulletMatch;
        const translatedContent = await session.translate(content);
        translatedLines.push(`${marker}${translatedContent.trim()}`);
      } else if (numberedMatch) {
        const [, marker, content] = numberedMatch;
        const translatedContent = await session.translate(content);
        translatedLines.push(`${marker}${translatedContent.trim()}`);
      } else if (headerMatch) {
        const [, marker, content] = headerMatch;
        const translatedContent = await session.translate(content);
        translatedLines.push(`${marker}${translatedContent.trim()}`);
      } else {
        const translatedLine = await session.translate(line);
        translatedLines.push(translatedLine.trim());
      }
    }

    return translatedLines.join('\n');
  }

  cleanupSessions(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastUsed > this.SESSION_TTL) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const session = this.sessions.get(key);
      if (session) {
        try {
          session.session.destroy();
          this.sessions.delete(key);
          console.log(`Cleaned up expired translator session: ${key}`);
        } catch (error) {
          console.error(`Error cleaning up session ${key}:`, error);
        }
      }
    }

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired sessions`);
    }
  }

  destroy(): void {
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.session.destroy();
        console.log(`Destroyed translator session: ${key}`);
      } catch (error) {
        console.error(`Error destroying session ${key}:`, error);
      }
    }
    this.sessions.clear();
  }

  destroySession(sourceLanguage: string, targetLanguage: string): void {
    const sessionKey = `${sourceLanguage}-${targetLanguage}`;
    const session = this.sessions.get(sessionKey);

    if (session) {
      try {
        session.session.destroy();
        this.sessions.delete(sessionKey);
        console.log(`Destroyed translator session: ${sessionKey}`);
      } catch (error) {
        console.error(`Error destroying session ${sessionKey}:`, error);
      }
    }
  }
}

export const translatorManager = new TranslatorManager();
```

---

## Type Definitions Update

```typescript
// src/types/chrome-ai.d.ts

export interface AITranslator {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  translateStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

export interface AITranslatorFactory {
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: { loaded: number; total: number }) => void
      ) => void;
    }) => void;
    signal?: AbortSignal;
  }): Promise<AITranslator>;

  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
}

declare global {
  var Translator: AITranslatorFactory | undefined;
}
```

---

## Capability Detector Update

```typescript
// src/background/capabilityDetector.ts

private checkAPIAvailability(apiName: string): boolean {
  try {
    if (typeof globalThis === 'undefined') {
      return false;
    }

    // Global APIs (not in ai namespace)
    if (
      apiName === 'writer' ||
      apiName === 'rewriter' ||
      apiName === 'proofreader'
    ) {
      const capitalizedName =
        apiName.charAt(0).toUpperCase() + apiName.slice(1);
      return capitalizedName in globalThis;
    }

    if (apiName === 'languageModel') {
      return 'LanguageModel' in globalThis;
    }

    // ✅ ADD THIS - Translator is also a global
    if (apiName === 'translator') {
      return 'Translator' in globalThis;
    }

    // For other APIs (summarizer, languageDetector), check through ai object
    const ai = (
      globalThis as typeof globalThis & { ai?: Record<string, unknown> }
    ).ai;

    if (!ai) {
      return false;
    }

    return apiName in ai;
  } catch (error) {
    console.warn(`Error checking ${apiName} availability:`, error);
    return false;
  }
}
```

---

## Summary of Changes Required

### Files to Update:

1. ✅ `src/background/translatorManager.ts` - Fix API access and create() method
2. ✅ `src/types/chrome-ai.d.ts` - Update type definitions
3. ✅ `src/background/capabilityDetector.ts` - Check for global Translator

### Key Corrections:

1. Use global `Translator` object, not `ai.translator`
2. Use `Translator.create({ sourceLanguage, targetLanguage })` with options object
3. Use `Translator.availability({ sourceLanguage, targetLanguage })` for checking support
4. Add `Translator` to global type declarations

---

## Testing Checklist

- [ ] Verify `typeof Translator !== 'undefined'` in console
- [ ] Test `Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' })`
- [ ] Test `Translator.create({ sourceLanguage: 'en', targetLanguage: 'es' })`
- [ ] Test translation: `translator.translate('Hello')`
- [ ] Test streaming: `translator.translateStreaming(longText)`
- [ ] Verify session caching works
- [ ] Test markdown preservation feature

---

## References

- [Official Translator API Documentation](https://developer.chrome.com/docs/ai/translator-api)
- [Built-in AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Language Detector API](https://developer.chrome.com/docs/ai/language-detection)

---

**Status**: Ready for implementation
**Priority**: High - Incorrect API usage will cause runtime errors
**Impact**: Breaking change - requires code updates
