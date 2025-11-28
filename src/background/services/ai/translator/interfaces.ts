/**
 * Translator Manager Interfaces
 * Following Interface Segregation Principle (ISP)
 */

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

export interface ITranslatorManager {
  checkAvailability(): Promise<boolean>;
  isAvailable(): boolean;
  canTranslate(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean>;
  translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string>;
  destroy(): void;
}
