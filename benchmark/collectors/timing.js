/**
 * Timing Collector - Tracks time-based metrics
 */

class TimingCollector {
  constructor() {
    this.timers = new Map();
    this.measurements = [];
  }

  /**
   * Start a timer for a task
   */
  startTimer(taskId, phase = 'total') {
    const key = `${taskId}:${phase}`;
    this.timers.set(key, {
      start: Date.now(),
      taskId,
      phase
    });
  }

  /**
   * Stop a timer and record duration
   */
  stopTimer(taskId, phase = 'total') {
    const key = `${taskId}:${phase}`;
    const timer = this.timers.get(key);
    
    if (!timer) {
      console.warn(`Timer not found: ${key}`);
      return null;
    }

    const duration = Date.now() - timer.start;
    const measurement = {
      taskId,
      phase,
      startTime: new Date(timer.start).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: duration,
      durationSec: (duration / 1000).toFixed(2),
      durationMin: (duration / 60000).toFixed(2)
    };

    this.measurements.push(measurement);
    this.timers.delete(key);
    
    return measurement;
  }

  /**
   * Get completion time for a task
   */
  getCompletionTime(taskId) {
    const total = this.measurements.find(m => m.taskId === taskId && m.phase === 'total');
    return total ? total.durationMs : null;
  }

  /**
   * Get all measurements for a task
   */
  getTaskMeasurements(taskId) {
    return this.measurements.filter(m => m.taskId === taskId);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const totalTimes = this.measurements
      .filter(m => m.phase === 'total')
      .map(m => m.durationMs);

    if (totalTimes.length === 0) {
      return null;
    }

    const avg = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
    const min = Math.min(...totalTimes);
    const max = Math.max(...totalTimes);
    
    // Calculate throughput (tasks per hour)
    const totalTimeMs = totalTimes.reduce((a, b) => a + b, 0);
    const throughput = (totalTimes.length / (totalTimeMs / 3600000)).toFixed(2);

    return {
      totalTasks: totalTimes.length,
      avgCompletionTimeMs: Math.round(avg),
      minCompletionTimeMs: min,
      maxCompletionTimeMs: max,
      avgCompletionTimeMin: (avg / 60000).toFixed(2),
      throughputPerHour: throughput
    };
  }

  /**
   * Export measurements as JSON
   */
  export() {
    return {
      measurements: this.measurements,
      summary: this.getSummary()
    };
  }

  /**
   * Reset all data
   */
  reset() {
    this.timers.clear();
    this.measurements = [];
  }
}

module.exports = { TimingCollector };
