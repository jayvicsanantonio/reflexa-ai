/**
 * Performance Monitor - Tracks and logs performance metrics
 * Monitors overlay render time, animation frame rates, and memory usage
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * PerformanceMonitor class for tracking extension performance
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics
  private frameRates: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private rafId: number | null = null;

  /**
   * Start measuring a performance metric
   * @param name Name of the metric
   * @returns Mark name for use with endMeasure
   */
  startMeasure(name: string): string {
    const markName = `${name}-start`;
    performance.mark(markName);
    return markName;
  }

  /**
   * End measuring a performance metric and log the result
   * @param name Name of the metric
   * @param markName Optional mark name from startMeasure
   * @returns Duration in milliseconds
   */
  endMeasure(name: string, markName?: string): number {
    const startMark = markName ?? `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-measure`;

    performance.mark(endMark);

    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      const duration = measure.duration;

      // Store metric
      this.addMetric(name, duration);

      // Log if duration exceeds threshold
      if (duration > 100) {
        console.warn(
          `⚠️ Performance: ${name} took ${duration.toFixed(2)}ms (threshold: 100ms)`
        );
      } else {
        console.log(`✓ Performance: ${name} took ${duration.toFixed(2)}ms`);
      }

      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);

      return duration;
    } catch (error) {
      console.error(`Failed to measure ${name}:`, error);
      return 0;
    }
  }

  /**
   * Add a metric to the history
   * @param name Metric name
   * @param duration Duration in milliseconds
   */
  private addMetric(name: string, duration: number): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get average duration for a specific metric
   * @param name Metric name
   * @returns Average duration in milliseconds
   */
  getAverageDuration(name: string): number {
    const filtered = this.metrics.filter((m) => m.name === name);
    if (filtered.length === 0) return 0;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Get all metrics for a specific name
   * @param name Metric name
   * @returns Array of metrics
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get all metrics
   * @returns Array of all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Start monitoring frame rate
   * Tracks FPS for animation performance
   */
  startFrameRateMonitoring(): void {
    if (this.rafId !== null) {
      console.warn('Frame rate monitoring already started');
      return;
    }

    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.frameRates = [];

    const measureFrame = (currentTime: number) => {
      const delta = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
      this.frameCount++;

      // Calculate FPS
      const fps = 1000 / delta;
      this.frameRates.push(fps);

      // Keep only last 60 frames (1 second at 60fps)
      if (this.frameRates.length > 60) {
        this.frameRates.shift();
      }

      // Log warning if FPS drops below 50
      const avgFps = this.getAverageFrameRate();
      if (avgFps < 50 && this.frameCount % 60 === 0) {
        console.warn(`⚠️ Low FPS detected: ${avgFps.toFixed(1)} fps`);
      }

      this.rafId = requestAnimationFrame(measureFrame);
    };

    this.rafId = requestAnimationFrame(measureFrame);
    console.log('Frame rate monitoring started');
  }

  /**
   * Stop monitoring frame rate
   */
  stopFrameRateMonitoring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      console.log(
        `Frame rate monitoring stopped. Average FPS: ${this.getAverageFrameRate().toFixed(1)}`
      );
    }
  }

  /**
   * Get current average frame rate
   * @returns Average FPS
   */
  getAverageFrameRate(): number {
    if (this.frameRates.length === 0) return 0;

    const sum = this.frameRates.reduce((acc, fps) => acc + fps, 0);
    return sum / this.frameRates.length;
  }

  /**
   * Get minimum frame rate from recent samples
   * @returns Minimum FPS
   */
  getMinimumFrameRate(): number {
    if (this.frameRates.length === 0) return 0;
    return Math.min(...this.frameRates);
  }

  /**
   * Get memory usage information
   * @returns Memory info object or null if not available
   */
  getMemoryUsage(): MemoryInfo | null {
    // Check if performance.memory is available (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory: MemoryInfo })
        .memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Log memory usage in a human-readable format
   */
  logMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    if (!memory) {
      console.log('Memory usage information not available');
      return;
    }

    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
    const usagePercent = (
      (memory.usedJSHeapSize / memory.jsHeapSizeLimit) *
      100
    ).toFixed(1);

    console.log(
      `Memory Usage: ${usedMB}MB / ${totalMB}MB (${usagePercent}% of ${limitMB}MB limit)`
    );

    // Warn if memory usage exceeds 150MB
    if (memory.usedJSHeapSize > 150 * 1024 * 1024) {
      console.warn(
        `⚠️ High memory usage detected: ${usedMB}MB (threshold: 150MB)`
      );
    }
  }

  /**
   * Generate a performance report
   * @returns Object with performance statistics
   */
  generateReport(): {
    metrics: Record<string, { avg: number; min: number; max: number }>;
    frameRate: { avg: number; min: number };
    memory: MemoryInfo | null;
  } {
    // Group metrics by name
    const metricsByName: Record<string, number[]> = {};
    for (const metric of this.metrics) {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      metricsByName[metric.name].push(metric.duration);
    }

    // Calculate statistics for each metric
    const metricStats: Record<
      string,
      { avg: number; min: number; max: number }
    > = {};
    for (const [name, durations] of Object.entries(metricsByName)) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      metricStats[name] = { avg, min, max };
    }

    return {
      metrics: metricStats,
      frameRate: {
        avg: this.getAverageFrameRate(),
        min: this.getMinimumFrameRate(),
      },
      memory: this.getMemoryUsage(),
    };
  }

  /**
   * Log a complete performance report
   */
  logReport(): void {
    const report = this.generateReport();

    console.group('📊 Performance Report');

    console.group('Metrics');
    for (const [name, stats] of Object.entries(report.metrics)) {
      console.log(
        `${name}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms`
      );
    }
    console.groupEnd();

    if (report.frameRate.avg > 0) {
      console.log(
        `Frame Rate: avg=${report.frameRate.avg.toFixed(1)}fps, min=${report.frameRate.min.toFixed(1)}fps`
      );
    }

    if (report.memory) {
      const usedMB = (report.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      console.log(`Memory Usage: ${usedMB}MB`);
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
