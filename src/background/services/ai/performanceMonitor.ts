/**
 * Performance Monitor for Chrome AI APIs
 * Tracks timing metrics and logs slow operations
 */

/**
 * Performance metrics for a single operation
 */
export interface PerformanceMetric {
  operationType: string;
  apiUsed: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  averageResponseTime: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  totalOperations: number;
  slowOperationsCount: number;
  operationsByType: Record<
    string,
    {
      count: number;
      averageDuration: number;
      totalDuration: number;
    }
  >;
  operationsByAPI: Record<
    string,
    {
      count: number;
      averageDuration: number;
      totalDuration: number;
    }
  >;
}

/**
 * Threshold for slow operations (in milliseconds)
 */
const SLOW_OPERATION_THRESHOLD = 5000; // 5 seconds

/**
 * Maximum number of metrics to keep in memory
 */
const MAX_METRICS_HISTORY = 100;

/**
 * Performance Monitor class
 * Tracks and analyzes AI operation performance
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  /**
   * Record a performance metric for an AI operation
   * @param operationType - Type of operation (e.g., 'summarize', 'write')
   * @param apiUsed - API that was used (e.g., 'prompt', 'summarizer')
   * @param duration - Duration in milliseconds
   * @param success - Whether the operation succeeded
   */
  recordMetric(
    operationType: string,
    apiUsed: string,
    duration: number,
    success: boolean
  ): void {
    const metric: PerformanceMetric = {
      operationType,
      apiUsed,
      duration,
      timestamp: Date.now(),
      success,
    };

    this.metrics.push(metric);

    // Log slow operations
    if (duration > SLOW_OPERATION_THRESHOLD) {
      console.warn(
        `[Performance] Slow operation detected: ${operationType} using ${apiUsed} took ${duration}ms`,
        {
          operationType,
          apiUsed,
          duration,
          success,
          threshold: SLOW_OPERATION_THRESHOLD,
        }
      );
    }

    // Keep only the most recent metrics
    if (this.metrics.length > MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-MAX_METRICS_HISTORY);
    }
  }

  /**
   * Get aggregated performance statistics
   * @returns Performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        averageResponseTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        totalOperations: 0,
        slowOperationsCount: 0,
        operationsByType: {},
        operationsByAPI: {},
      };
    }

    // Calculate average response time
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalDuration / this.metrics.length;

    // Find slowest and fastest operations
    const sortedByDuration = [...this.metrics].sort(
      (a, b) => a.duration - b.duration
    );
    const fastestOperation = sortedByDuration[0];
    const slowestOperation = sortedByDuration[sortedByDuration.length - 1];

    // Count slow operations
    const slowOperationsCount = this.metrics.filter(
      (m) => m.duration > SLOW_OPERATION_THRESHOLD
    ).length;

    // Aggregate by operation type
    const operationsByType: Record<
      string,
      {
        count: number;
        averageDuration: number;
        totalDuration: number;
      }
    > = {};

    for (const metric of this.metrics) {
      if (!operationsByType[metric.operationType]) {
        operationsByType[metric.operationType] = {
          count: 0,
          averageDuration: 0,
          totalDuration: 0,
        };
      }
      operationsByType[metric.operationType].count++;
      operationsByType[metric.operationType].totalDuration += metric.duration;
    }

    // Calculate averages for operation types
    for (const type in operationsByType) {
      const stats = operationsByType[type];
      stats.averageDuration = stats.totalDuration / stats.count;
    }

    // Aggregate by API
    const operationsByAPI: Record<
      string,
      {
        count: number;
        averageDuration: number;
        totalDuration: number;
      }
    > = {};

    for (const metric of this.metrics) {
      if (!operationsByAPI[metric.apiUsed]) {
        operationsByAPI[metric.apiUsed] = {
          count: 0,
          averageDuration: 0,
          totalDuration: 0,
        };
      }
      operationsByAPI[metric.apiUsed].count++;
      operationsByAPI[metric.apiUsed].totalDuration += metric.duration;
    }

    // Calculate averages for APIs
    for (const api in operationsByAPI) {
      const stats = operationsByAPI[api];
      stats.averageDuration = stats.totalDuration / stats.count;
    }

    return {
      averageResponseTime,
      slowestOperation,
      fastestOperation,
      totalOperations: this.metrics.length,
      slowOperationsCount,
      operationsByType,
      operationsByAPI,
    };
  }

  /**
   * Get recent metrics
   * @param count - Number of recent metrics to retrieve
   * @returns Array of recent metrics
   */
  getRecentMetrics(count = 10): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get metrics for a specific operation type
   * @param operationType - Type of operation to filter by
   * @returns Array of metrics for the operation type
   */
  getMetricsByType(operationType: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.operationType === operationType);
  }

  /**
   * Get metrics for a specific API
   * @param apiUsed - API to filter by
   * @returns Array of metrics for the API
   */
  getMetricsByAPI(apiUsed: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.apiUsed === apiUsed);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
