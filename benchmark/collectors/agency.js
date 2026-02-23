/**
 * Agency Collector - Tracks agency-specific metrics
 */

const fs = require('fs');
const path = require('path');

class AgencyCollector {
  constructor(agencyPath) {
    this.agencyPath = agencyPath;
    this.measurements = [];
    this.taskResults = [];
  }

  /**
   * Record task result
   */
  recordTaskResult(taskId, result) {
    const entry = {
      taskId,
      timestamp: new Date().toISOString(),
      success: result.success || false,
      autonomous: result.autonomous !== false, // True if completed without human intervention
      kpisPassed: result.kpisPassed || {
        typescript: false,
        lint: false,
        build: false,
        tests: false
      },
      iterations: result.iterations || 0,
      pmOutput: result.pmOutput || null,
      discoveryOutput: result.discoveryOutput || null
    };

    // Calculate derived metrics
    entry.kpiPassRate = this.calculateKpiPassRate(entry.kpisPassed);
    entry.firstTrySuccess = entry.kpiPassRate === 100 && entry.iterations <= 1;

    this.taskResults.push(entry);
    return entry;
  }

  /**
   * Calculate KPI pass rate
   */
  calculateKpiPassRate(kpis) {
    const values = Object.values(kpis);
    const passed = values.filter(v => v === true).length;
    return (passed / values.length * 100).toFixed(0);
  }

  /**
   * Record PM accuracy
   */
  recordPMAccuracy(taskId, pmOutput, groundTruth) {
    const entry = {
      taskId,
      timestamp: new Date().toISOString(),
      pmIntent: pmOutput.intent,
      correctIntent: groundTruth.intent,
      intentCorrect: pmOutput.intent === groundTruth.intent,
      pmKeywords: pmOutput.keywords || [],
      correctKeywords: groundTruth.keywords || [],
      keywordPrecision: this.calculatePrecision(pmOutput.keywords, groundTruth.keywords),
      keywordRecall: this.calculateRecall(pmOutput.keywords, groundTruth.keywords),
      filesSuggested: pmOutput.files || [],
      correctFiles: groundTruth.files || []
    };

    this.measurements.push(entry);
    return entry;
  }

  /**
   * Calculate precision
   */
  calculatePrecision(predicted, actual) {
    if (!predicted || predicted.length === 0) return 0;
    const intersection = predicted.filter(p => actual.includes(p));
    return (intersection.length / predicted.length * 100).toFixed(1);
  }

  /**
   * Calculate recall
   */
  calculateRecall(predicted, actual) {
    if (!actual || actual.length === 0) return 0;
    const intersection = predicted.filter(p => actual.includes(p));
    return (intersection.length / actual.length * 100).toFixed(1);
  }

  /**
   * Record file discovery metrics
   */
  recordFileDiscovery(taskId, discovered, expected) {
    const entry = {
      taskId,
      timestamp: new Date().toISOString(),
      discoveredFiles: discovered,
      expectedFiles: expected,
      truePositives: discovered.filter(f => expected.includes(f)).length,
      falsePositives: discovered.filter(f => !expected.includes(f)).length,
      falseNegatives: expected.filter(f => !discovered.includes(f)).length
    };

    entry.precision = entry.truePositives / (entry.truePositives + entry.falsePositives) * 100 || 0;
    entry.recall = entry.truePositives / (entry.truePositives + entry.falseNegatives) * 100 || 0;
    entry.f1Score = 2 * (entry.precision * entry.recall) / (entry.precision + entry.recall) || 0;

    this.measurements.push(entry);
    return entry;
  }

  /**
   * Get task success rate
   */
  getTaskSuccessRate() {
    const total = this.taskResults.length;
    const successful = this.taskResults.filter(r => r.success).length;
    const autonomous = this.taskResults.filter(r => r.autonomous && r.success).length;

    return {
      total,
      successful,
      autonomous,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0,
      autonomousRate: total > 0 ? (autonomous / total * 100).toFixed(1) : 0
    };
  }

  /**
   * Get KPI pass statistics
   */
  getKPIStats() {
    const total = this.taskResults.length;
    const firstTry = this.taskResults.filter(r => r.firstTrySuccess).length;
    
    const avgIterations = total > 0
      ? this.taskResults.reduce((sum, r) => sum + r.iterations, 0) / total
      : 0;

    const kpis = { typescript: 0, lint: 0, build: 0, tests: 0 };
    for (const result of this.taskResults) {
      for (const [kpi, passed] of Object.entries(result.kpisPassed)) {
        if (passed) kpis[kpi]++;
      }
    }

    return {
      firstTrySuccessRate: total > 0 ? (firstTry / total * 100).toFixed(1) : 0,
      avgIterations: avgIterations.toFixed(2),
      kpiPassCounts: kpis,
      kpiPassRates: {
        typescript: total > 0 ? (kpis.typescript / total * 100).toFixed(1) : 0,
        lint: total > 0 ? (kpis.lint / total * 100).toFixed(1) : 0,
        build: total > 0 ? (kpis.build / total * 100).toFixed(1) : 0,
        tests: total > 0 ? (kpis.tests / total * 100).toFixed(1) : 0
      }
    };
  }

  /**
   * Get PM accuracy statistics
   */
  getPMAccuracyStats() {
    const pmMeasurements = this.measurements.filter(m => m.pmIntent);
    
    if (pmMeasurements.length === 0) {
      return null;
    }

    const intentCorrect = pmMeasurements.filter(m => m.intentCorrect).length;
    const avgPrecision = pmMeasurements.reduce((sum, m) => sum + parseFloat(m.keywordPrecision), 0) / pmMeasurements.length;
    const avgRecall = pmMeasurements.reduce((sum, m) => sum + parseFloat(m.keywordRecall), 0) / pmMeasurements.length;

    return {
      tasks: pmMeasurements.length,
      intentAccuracy: (intentCorrect / pmMeasurements.length * 100).toFixed(1),
      avgKeywordPrecision: avgPrecision.toFixed(1),
      avgKeywordRecall: avgRecall.toFixed(1)
    };
  }

  /**
   * Get file discovery statistics
   */
  getFileDiscoveryStats() {
    const discoveryMeasurements = this.measurements.filter(m => m.discoveredFiles);
    
    if (discoveryMeasurements.length === 0) {
      return null;
    }

    const avgPrecision = discoveryMeasurements.reduce((sum, m) => sum + m.precision, 0) / discoveryMeasurements.length;
    const avgRecall = discoveryMeasurements.reduce((sum, m) => sum + m.recall, 0) / discoveryMeasurements.length;
    const avgF1 = discoveryMeasurements.reduce((sum, m) => sum + m.f1Score, 0) / discoveryMeasurements.length;

    return {
      tasks: discoveryMeasurements.length,
      avgPrecision: avgPrecision.toFixed(1),
      avgRecall: avgRecall.toFixed(1),
      avgF1Score: avgF1.toFixed(1)
    };
  }

  /**
   * Get summary
   */
  getSummary() {
    return {
      taskSuccess: this.getTaskSuccessRate(),
      kpiStats: this.getKPIStats(),
      pmAccuracy: this.getPMAccuracyStats(),
      fileDiscovery: this.getFileDiscoveryStats()
    };
  }

  /**
   * Export all data
   */
  export() {
    return {
      taskResults: this.taskResults,
      measurements: this.measurements,
      summary: this.getSummary()
    };
  }

  /**
   * Reset all data
   */
  reset() {
    this.measurements = [];
    this.taskResults = [];
  }
}

module.exports = { AgencyCollector };
