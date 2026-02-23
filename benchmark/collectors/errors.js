/**
 * Error Collector - Tracks errors and failures
 */

class ErrorCollector {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.retries = [];
  }

  /**
   * Record an error
   */
  recordError(taskId, error) {
    const entry = {
      taskId,
      timestamp: new Date().toISOString(),
      type: error.type || 'unknown',
      message: error.message || String(error),
      phase: error.phase || 'unknown',
      recoverable: error.recoverable !== false,
      stack: error.stack || null
    };

    this.errors.push(entry);
    return entry;
  }

  /**
   * Record a warning
   */
  recordWarning(taskId, warning) {
    const entry = {
      taskId,
      timestamp: new Date().toISOString(),
      type: warning.type || 'unknown',
      message: warning.message || String(warning),
      phase: warning.phase || 'unknown'
    };

    this.warnings.push(entry);
    return entry;
  }

  /**
   * Record a retry attempt
   */
  recordRetry(taskId, reason) {
    const entry = {
      taskId,
      timestamp: new Date().toISOString(),
      reason: reason.message || reason,
      attemptNumber: this.retries.filter(r => r.taskId === taskId).length + 1
    };

    this.retries.push(entry);
    return entry;
  }

  /**
   * Get error count for a task
   */
  getErrorCount(taskId) {
    return this.errors.filter(e => e.taskId === taskId).length;
  }

  /**
   * Get retry count for a task
   */
  getRetryCount(taskId) {
    return this.retries.filter(r => r.taskId === taskId).length;
  }

  /**
   * Get error rate (errors per task)
   */
  getErrorRate() {
    const taskIds = new Set([
      ...this.errors.map(e => e.taskId),
      ...this.retries.map(r => r.taskId)
    ]);
    
    const totalTasks = taskIds.size || 1;
    const totalErrors = this.errors.length;
    
    return {
      totalErrors: totalErrors,
      totalWarnings: this.warnings.length,
      totalRetries: this.retries.length,
      errorRate: (totalErrors / totalTasks).toFixed(2),
      retryRate: (this.retries.length / totalTasks).toFixed(2),
      tasksAffected: taskIds.size
    };
  }

  /**
   * Get errors by type
   */
  getErrorsByType() {
    const byType = {};
    
    for (const error of this.errors) {
      byType[error.type] = (byType[error.type] || 0) + 1;
    }
    
    return byType;
  }

  /**
   * Get errors by phase
   */
  getErrorsByPhase() {
    const byPhase = {};
    
    for (const error of this.errors) {
      byPhase[error.phase] = (byPhase[error.phase] || 0) + 1;
    }
    
    return byPhase;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      ...this.getErrorRate(),
      errorsByType: this.getErrorsByType(),
      errorsByPhase: this.getErrorsByPhase(),
      recoverableErrors: this.errors.filter(e => e.recoverable).length,
      unrecoverableErrors: this.errors.filter(e => !e.recoverable).length
    };
  }

  /**
   * Export all data
   */
  export() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      retries: this.retries,
      summary: this.getSummary()
    };
  }

  /**
   * Reset all data
   */
  reset() {
    this.errors = [];
    this.warnings = [];
    this.retries = [];
  }
}

module.exports = { ErrorCollector };
