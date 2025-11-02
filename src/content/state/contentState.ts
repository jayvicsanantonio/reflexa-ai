/**
 * Centralized state store for content script
 * Manages all module-level state variables in a structured way
 */

import type {
  UIState,
  ReflectionState,
  LanguageState,
  AIState,
  AudioState,
  ContentScriptState,
} from './types';
import type { SummaryFormat } from '../../types';

/**
 * Content script state store
 * Singleton pattern for centralized state management
 */
class ContentScriptStateStore {
  private state: ContentScriptState;

  constructor() {
    this.state = {
      ui: {
        nudge: {
          container: null,
          root: null,
          isVisible: false,
          isLoading: false,
        },
        overlay: {
          container: null,
          root: null,
          isVisible: false,
        },
        errorModal: {
          container: null,
          root: null,
          isVisible: false,
        },
        notification: {
          container: null,
          root: null,
          isVisible: false,
        },
        helpModal: {
          container: null,
          root: null,
          isVisible: false,
        },
        settingsModal: {
          container: null,
          root: null,
          isVisible: false,
        },
        dashboardModal: {
          container: null,
          root: null,
          isVisible: false,
        },
      },
      reflection: {
        extractedContent: null,
        summary: [],
        summaryDisplay: [],
        prompts: [],
        format: 'bullets',
        isLoadingSummary: false,
        summaryBuffer: '',
        summaryAnimationIndex: 0,
        summaryAnimationTimer: null,
        summaryAnimationFormat: 'bullets',
        summaryStreamComplete: false,
        activeSummaryStreamCleanup: null,
        isRewriting: [false, false],
      },
      language: {
        detection: null,
        isTranslating: false,
        selectedTargetLanguage: null,
        preferredLanguageBaseline: null,
        isTargetLanguageOverridden: false,
        originalDetectedLanguage: null,
        originalContentLanguage: null,
      },
      ai: {
        capabilities: null,
        available: null,
      },
      audio: {
        isAmbientMuted: false,
      },
    };
  }

  /**
   * Get complete state (for debugging/logging)
   */
  getState(): ContentScriptState {
    return this.state;
  }

  /**
   * UI State Getters
   */
  getUIState(): UIState {
    return this.state.ui;
  }

  getNudgeState() {
    return this.state.ui.nudge;
  }

  getOverlayState() {
    return this.state.ui.overlay;
  }

  getErrorModalState() {
    return this.state.ui.errorModal;
  }

  getNotificationState() {
    return this.state.ui.notification;
  }

  getHelpModalState() {
    return this.state.ui.helpModal;
  }

  getSettingsModalState() {
    return this.state.ui.settingsModal;
  }

  getDashboardModalState() {
    return this.state.ui.dashboardModal;
  }

  /**
   * UI State Setters
   */
  setNudgeState(updates: Partial<UIState['nudge']>) {
    this.state.ui.nudge = { ...this.state.ui.nudge, ...updates };
  }

  setOverlayState(updates: Partial<UIState['overlay']>) {
    this.state.ui.overlay = { ...this.state.ui.overlay, ...updates };
  }

  setErrorModalState(updates: Partial<UIState['errorModal']>) {
    this.state.ui.errorModal = {
      ...this.state.ui.errorModal,
      ...updates,
    };
  }

  setNotificationState(updates: Partial<UIState['notification']>) {
    this.state.ui.notification = {
      ...this.state.ui.notification,
      ...updates,
    };
  }

  setHelpModalState(updates: Partial<UIState['helpModal']>) {
    this.state.ui.helpModal = {
      ...this.state.ui.helpModal,
      ...updates,
    };
  }

  setSettingsModalState(updates: Partial<UIState['settingsModal']>) {
    this.state.ui.settingsModal = {
      ...this.state.ui.settingsModal,
      ...updates,
    };
  }

  setDashboardModalState(updates: Partial<UIState['dashboardModal']>) {
    this.state.ui.dashboardModal = {
      ...this.state.ui.dashboardModal,
      ...updates,
    };
  }

  /**
   * Reflection State Getters
   */
  getReflectionState(): ReflectionState {
    return this.state.reflection;
  }

  getExtractedContent() {
    return this.state.reflection.extractedContent;
  }

  getSummary() {
    return this.state.reflection.summary;
  }

  getSummaryDisplay() {
    return this.state.reflection.summaryDisplay;
  }

  getPrompts() {
    return this.state.reflection.prompts;
  }

  getSummaryFormat() {
    return this.state.reflection.format;
  }

  getIsLoadingSummary() {
    return this.state.reflection.isLoadingSummary;
  }

  getSummaryBuffer() {
    return this.state.reflection.summaryBuffer;
  }

  getSummaryAnimationIndex() {
    return this.state.reflection.summaryAnimationIndex;
  }

  getSummaryAnimationTimer() {
    return this.state.reflection.summaryAnimationTimer;
  }

  getSummaryAnimationFormat() {
    return this.state.reflection.summaryAnimationFormat;
  }

  getSummaryStreamComplete() {
    return this.state.reflection.summaryStreamComplete;
  }

  getActiveSummaryStreamCleanup() {
    return this.state.reflection.activeSummaryStreamCleanup;
  }

  getIsRewriting(index: number) {
    return this.state.reflection.isRewriting[index];
  }

  /**
   * Reflection State Setters
   */
  setExtractedContent(content: ReflectionState['extractedContent']) {
    this.state.reflection.extractedContent = content;
  }

  setSummary(summary: string[]) {
    this.state.reflection.summary = summary;
  }

  setSummaryDisplay(display: string[]) {
    this.state.reflection.summaryDisplay = display;
  }

  setPrompts(prompts: string[]) {
    this.state.reflection.prompts = prompts;
  }

  setSummaryFormat(format: SummaryFormat) {
    this.state.reflection.format = format;
  }

  setIsLoadingSummary(isLoading: boolean) {
    this.state.reflection.isLoadingSummary = isLoading;
  }

  setSummaryBuffer(buffer: string) {
    this.state.reflection.summaryBuffer = buffer;
  }

  setSummaryAnimationIndex(index: number) {
    this.state.reflection.summaryAnimationIndex = index;
  }

  setSummaryAnimationTimer(timer: number | null) {
    this.state.reflection.summaryAnimationTimer = timer;
  }

  setSummaryAnimationFormat(format: SummaryFormat) {
    this.state.reflection.summaryAnimationFormat = format;
  }

  setSummaryStreamComplete(complete: boolean) {
    this.state.reflection.summaryStreamComplete = complete;
  }

  setActiveSummaryStreamCleanup(cleanup: (() => void) | null) {
    this.state.reflection.activeSummaryStreamCleanup = cleanup;
  }

  setIsRewriting(index: number, isRewriting: boolean) {
    this.state.reflection.isRewriting[index] = isRewriting;
  }

  updateReflectionState(updates: Partial<ReflectionState>) {
    this.state.reflection = { ...this.state.reflection, ...updates };
  }

  /**
   * Language State Getters
   */
  getLanguageState(): LanguageState {
    return this.state.language;
  }

  getLanguageDetection() {
    return this.state.language.detection;
  }

  getIsTranslating() {
    return this.state.language.isTranslating;
  }

  getSelectedTargetLanguage() {
    return this.state.language.selectedTargetLanguage;
  }

  getPreferredLanguageBaseline() {
    return this.state.language.preferredLanguageBaseline;
  }

  getIsTargetLanguageOverridden() {
    return this.state.language.isTargetLanguageOverridden;
  }

  getOriginalDetectedLanguage() {
    return this.state.language.originalDetectedLanguage;
  }

  getOriginalContentLanguage() {
    return this.state.language.originalContentLanguage;
  }

  /**
   * Language State Setters
   */
  setLanguageDetection(detection: LanguageState['detection']) {
    this.state.language.detection = detection;
  }

  setIsTranslating(isTranslating: boolean) {
    this.state.language.isTranslating = isTranslating;
  }

  setSelectedTargetLanguage(language: string | null) {
    this.state.language.selectedTargetLanguage = language;
  }

  setPreferredLanguageBaseline(baseline: string | null) {
    this.state.language.preferredLanguageBaseline = baseline;
  }

  setIsTargetLanguageOverridden(overridden: boolean) {
    this.state.language.isTargetLanguageOverridden = overridden;
  }

  setOriginalDetectedLanguage(language: string | null) {
    this.state.language.originalDetectedLanguage = language;
  }

  setOriginalContentLanguage(
    language: LanguageState['originalContentLanguage']
  ) {
    this.state.language.originalContentLanguage = language;
  }

  updateLanguageState(updates: Partial<LanguageState>) {
    this.state.language = { ...this.state.language, ...updates };
  }

  /**
   * AI State Getters
   */
  getAIState(): AIState {
    return this.state.ai;
  }

  getAICapabilities() {
    return this.state.ai.capabilities;
  }

  getAIAvailable() {
    return this.state.ai.available;
  }

  /**
   * AI State Setters
   */
  setAICapabilities(capabilities: AIState['capabilities']) {
    this.state.ai.capabilities = capabilities;
  }

  setAIAvailable(available: boolean | null) {
    this.state.ai.available = available;
  }

  /**
   * Audio State Getters
   */
  getAudioState(): AudioState {
    return this.state.audio;
  }

  getIsAmbientMuted() {
    return this.state.audio.isAmbientMuted;
  }

  /**
   * Audio State Setters
   */
  setIsAmbientMuted(muted: boolean) {
    this.state.audio.isAmbientMuted = muted;
  }

  /**
   * Reset methods for cleanup
   */
  resetUIState() {
    this.state.ui = {
      nudge: {
        container: null,
        root: null,
        isVisible: false,
        isLoading: false,
      },
      overlay: {
        container: null,
        root: null,
        isVisible: false,
      },
      errorModal: {
        container: null,
        root: null,
        isVisible: false,
      },
      notification: {
        container: null,
        root: null,
        isVisible: false,
      },
      helpModal: {
        container: null,
        root: null,
        isVisible: false,
      },
      settingsModal: {
        container: null,
        root: null,
        isVisible: false,
      },
      dashboardModal: {
        container: null,
        root: null,
        isVisible: false,
      },
    };
  }

  resetReflectionState() {
    this.state.reflection = {
      extractedContent: null,
      summary: [],
      summaryDisplay: [],
      prompts: [],
      format: 'bullets',
      isLoadingSummary: false,
      summaryBuffer: '',
      summaryAnimationIndex: 0,
      summaryAnimationTimer: null,
      summaryAnimationFormat: 'bullets',
      summaryStreamComplete: false,
      activeSummaryStreamCleanup: null,
      isRewriting: [false, false],
    };
  }

  resetLanguageState() {
    this.state.language = {
      detection: null,
      isTranslating: false,
      selectedTargetLanguage: null,
      preferredLanguageBaseline: null,
      isTargetLanguageOverridden: false,
      originalDetectedLanguage: null,
      originalContentLanguage: null,
    };
  }

  resetAll() {
    this.resetUIState();
    this.resetReflectionState();
    this.resetLanguageState();
    this.state.ai = {
      capabilities: null,
      available: null,
    };
    this.state.audio = {
      isAmbientMuted: false,
    };
  }
}

/**
 * Singleton instance of the content script state store
 */
export const contentState = new ContentScriptStateStore();
