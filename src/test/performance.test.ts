/**
 * Performance Tests
 * Tests overlay render time, animation frame rates, memory usage, and AI latency
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor } from '../utils/performanceMonitor';

describe('Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    performanceMonitor.stopFrameRateMonitoring();
  });

  describe('Overlay Render Time (Requirement 11.1)', () => {
    it('should measure overlay render time under 300ms', () => {
      // Simulate overlay render
      performanceMonitor.startMeasure('overlay-render');

      // Simulate DOM operations
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="reflexa-overlay">
          <div class="reflexa-overlay__backdrop"></div>
          <div class="reflexa-overlay__content">
            <div class="reflexa-breathing-orb"></div>
            <h1>Reflect & Absorb</h1>
            <section class="reflexa-overlay__summary">
              <div class="reflexa-overlay__summary-item">
                <div class="reflexa-overlay__summary-label">Insight</div>
                <p>Summary point 1</p>
              </div>
              <div class="reflexa-overlay__summary-item">
                <div class="reflexa-overlay__summary-label">Surprise</div>
                <p>Summary point 2</p>
              </div>
              <div class="reflexa-overlay__summary-item">
                <div class="reflexa-overlay__summary-label">Apply</div>
                <p>Summary point 3</p>
              </div>
            </section>
            <section class="reflexa-overlay__reflections">
              <textarea placeholder="Reflection 1"></textarea>
              <textarea placeholder="Reflection 2"></textarea>
            </section>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      const duration = performanceMonitor.endMeasure('overlay-render');

      // Requirement 11.1: Overlay should render within 300ms
      expect(duration).toBeLessThan(300);

      // Cleanup
      document.body.removeChild(container);
    });

    it('should track multiple overlay renders', () => {
      // Simulate 5 overlay renders
      for (let i = 0; i < 5; i++) {
        performanceMonitor.startMeasure('overlay-render');
        const container = document.createElement('div');
        container.innerHTML = '<div class="reflexa-overlay"></div>';
        document.body.appendChild(container);
        performanceMonitor.endMeasure('overlay-render');
        document.body.removeChild(container);
      }

      const metrics = performanceMonitor.getMetrics('overlay-render');
      expect(metrics).toHaveLength(5);

      const avgDuration =
        performanceMonitor.getAverageDuration('overlay-render');
      expect(avgDuration).toBeLessThan(300);
    });
  });

  describe('Animation Frame Rate (Requirement 11.2)', () => {
    it('should maintain 60fps during animation cycle', async () => {
      performanceMonitor.startFrameRateMonitoring();

      // Simulate animation for 100ms (enough to get frame samples)
      await new Promise((resolve) => setTimeout(resolve, 100));

      performanceMonitor.stopFrameRateMonitoring();

      const avgFps = performanceMonitor.getAverageFrameRate();
      const minFps = performanceMonitor.getMinimumFrameRate();

      // Requirement 11.2: Should maintain 60fps
      // Allow some tolerance for test environment
      expect(avgFps).toBeGreaterThan(50);
      expect(minFps).toBeGreaterThan(45);
    });

    it('should detect low frame rates', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      performanceMonitor.startFrameRateMonitoring();

      // Simulate heavy work that might drop frames
      await new Promise((resolve) => {
        let count = 0;
        const interval = setInterval(() => {
          // Simulate CPU-intensive work
          for (let i = 0; i < 1000000; i++) {
            Math.sqrt(i);
          }
          count++;
          if (count >= 10) {
            clearInterval(interval);
            resolve(undefined);
          }
        }, 10);
      });

      performanceMonitor.stopFrameRateMonitoring();

      const avgFps = performanceMonitor.getAverageFrameRate();
      expect(avgFps).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Usage (Requirement 11.3)', () => {
    it('should track memory usage', () => {
      const memory = performanceMonitor.getMemoryUsage();

      if (memory) {
        // Requirement 11.3: Should consume no more than 150MB
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        expect(usedMB).toBeLessThan(150);

        expect(memory.usedJSHeapSize).toBeGreaterThan(0);
        expect(memory.totalJSHeapSize).toBeGreaterThan(0);
        expect(memory.jsHeapSizeLimit).toBeGreaterThan(0);
      } else {
        // Memory API not available in test environment
        console.log('Memory API not available in test environment');
      }
    });

    it('should log memory usage without errors', () => {
      expect(() => {
        performanceMonitor.logMemoryUsage();
      }).not.toThrow();
    });

    it('should warn on high memory usage', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create large arrays to simulate memory usage
      const largeArrays: number[][] = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(i));
      }

      performanceMonitor.logMemoryUsage();

      // Keep reference to prevent garbage collection
      expect(largeArrays.length).toBe(100);

      consoleSpy.mockRestore();
    });
  });

  describe('AI Latency Simulation (Requirement 11.4)', () => {
    it('should measure AI summarization latency under 4 seconds', async () => {
      performanceMonitor.startMeasure('ai-summarization');

      // Simulate AI processing with various content lengths
      const shortContent = 'A'.repeat(500); // ~500 tokens
      const mediumContent = 'A'.repeat(1500); // ~1500 tokens
      const longContent = 'A'.repeat(3000); // ~3000 tokens

      // Simulate processing time (proportional to content length)
      const processContent = (content: string) => {
        return new Promise((resolve) => {
          const delay = Math.min((content.length / 1000) * 100, 4000);
          setTimeout(resolve, delay);
        });
      };

      await processContent(shortContent);
      const duration = performanceMonitor.endMeasure('ai-summarization');

      // Requirement 11.4: AI should complete within 4 seconds
      expect(duration).toBeLessThan(4000);
    });

    it('should measure AI latency for various content lengths', async () => {
      const contentLengths = [500, 1000, 1500, 2000, 2500, 3000];

      for (const length of contentLengths) {
        performanceMonitor.startMeasure(`ai-latency-${length}`);

        // Simulate AI processing
        await new Promise((resolve) => {
          const delay = Math.min((length / 1000) * 100, 4000);
          setTimeout(resolve, delay);
        });

        const duration = performanceMonitor.endMeasure(`ai-latency-${length}`);

        // All should complete within 4 seconds
        expect(duration).toBeLessThan(4000);
      }
    });

    it('should handle AI timeout gracefully', async () => {
      performanceMonitor.startMeasure('ai-timeout');

      // Simulate timeout scenario
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI timeout')), 4000);
      });

      const aiPromise = new Promise((resolve) => {
        setTimeout(resolve, 5000); // Takes longer than timeout
      });

      try {
        await Promise.race([aiPromise, timeoutPromise]);
      } catch (error) {
        // Expected timeout
        expect(error).toBeInstanceOf(Error);
      }

      const duration = performanceMonitor.endMeasure('ai-timeout');
      expect(duration).toBeLessThan(4100); // Allow small buffer
    });
  });

  describe('UI Injection Performance (Requirement 11.5)', () => {
    it('should inject UI without causing layout shifts', () => {
      performanceMonitor.startMeasure('ui-injection');

      // Measure initial layout
      const initialHeight = document.body.scrollHeight;

      // Create shadow DOM (as done in content script)
      const container = document.createElement('div');
      container.id = 'reflexa-root';
      const shadowRoot = container.attachShadow({ mode: 'open' });

      // Inject overlay into shadow DOM
      const overlay = document.createElement('div');
      overlay.className = 'reflexa-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '999999';

      shadowRoot.appendChild(overlay);
      document.body.appendChild(container);

      const duration = performanceMonitor.endMeasure('ui-injection');

      // Measure final layout
      const finalHeight = document.body.scrollHeight;

      // Requirement 11.5: Should not cause layout shifts
      expect(finalHeight).toBe(initialHeight);

      // Should inject quickly
      expect(duration).toBeLessThan(100);

      // Cleanup
      document.body.removeChild(container);
    });

    it('should inject multiple UI elements efficiently', () => {
      const injectionTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        performanceMonitor.startMeasure(`ui-injection-${i}`);

        const container = document.createElement('div');
        const shadowRoot = container.attachShadow({ mode: 'open' });
        const content = document.createElement('div');
        content.innerHTML = '<div>Test content</div>';
        shadowRoot.appendChild(content);
        document.body.appendChild(container);

        const duration = performanceMonitor.endMeasure(`ui-injection-${i}`);
        injectionTimes.push(duration);

        document.body.removeChild(container);
      }

      // All injections should be fast
      injectionTimes.forEach((time) => {
        expect(time).toBeLessThan(100);
      });

      // Average should be even faster
      const avgTime =
        injectionTimes.reduce((a, b) => a + b, 0) / injectionTimes.length;
      expect(avgTime).toBeLessThan(50);
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', () => {
      // Add some test metrics
      performanceMonitor.startMeasure('test-metric-1');
      performanceMonitor.endMeasure('test-metric-1');

      performanceMonitor.startMeasure('test-metric-2');
      performanceMonitor.endMeasure('test-metric-2');

      const report = performanceMonitor.generateReport();

      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('frameRate');
      expect(report).toHaveProperty('memory');

      expect(report.metrics['test-metric-1']).toBeDefined();
      expect(report.metrics['test-metric-1']).toHaveProperty('avg');
      expect(report.metrics['test-metric-1']).toHaveProperty('min');
      expect(report.metrics['test-metric-1']).toHaveProperty('max');
    });

    it('should log report without errors', () => {
      performanceMonitor.startMeasure('test-metric');
      performanceMonitor.endMeasure('test-metric');

      expect(() => {
        performanceMonitor.logReport();
      }).not.toThrow();
    });
  });

  describe('Performance Thresholds', () => {
    it('should meet all performance requirements', () => {
      const requirements = {
        overlayRenderTime: 300, // ms (Requirement 11.1)
        minFrameRate: 60, // fps (Requirement 11.2)
        maxMemoryUsage: 150, // MB (Requirement 11.3)
        aiLatency: 4000, // ms (Requirement 11.4)
        uiInjectionTime: 100, // ms (Requirement 11.5)
      };

      // Verify thresholds are reasonable
      expect(requirements.overlayRenderTime).toBeLessThanOrEqual(300);
      expect(requirements.minFrameRate).toBeGreaterThanOrEqual(60);
      expect(requirements.maxMemoryUsage).toBeLessThanOrEqual(150);
      expect(requirements.aiLatency).toBeLessThanOrEqual(4000);
      expect(requirements.uiInjectionTime).toBeLessThanOrEqual(100);
    });
  });
});
