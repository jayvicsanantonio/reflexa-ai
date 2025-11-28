/**
 * Proofreader Manager Interfaces
 * Following Interface Segregation Principle (ISP)
 */

export interface ProofreadResult {
  correctedText: string;
  corrections: {
    startIndex: number;
    endIndex: number;
    original: string;
  }[];
}

export interface ProofreaderConfig {
  expectedInputLanguages?: string[];
}

export interface IProofreaderManager {
  checkAvailability(): Promise<boolean>;
  isAvailable(): boolean;
  proofread(
    text: string,
    options?: ProofreaderConfig
  ): Promise<ProofreadResult>;
  destroy(): void;
}
