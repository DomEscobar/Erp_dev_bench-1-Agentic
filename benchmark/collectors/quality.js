/**
 * Quality Collector - Tracks code quality metrics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QualityCollector {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.measurements = [];
  }

  /**
   * Run all quality checks for a task
   */
  async measure(taskId, options = {}) {
    const result = {
      taskId,
      timestamp: new Date().toISOString(),
      lint: null,
      typescript: null,
      coverage: null,
      codeQuality: null
    };

    // Lint score
    if (options.checkLint !== false) {
      result.lint = this.getLintScore();
    }

    // TypeScript check
    if (options.checkTypescript !== false) {
      result.typescript = this.getTypeScriptStatus();
    }

    // Test coverage
    if (options.checkCoverage !== false) {
      result.coverage = this.getTestCoverage();
    }

    // Code quality (LLM-evaluated later)
    result.codeQuality = null; // Placeholder for LLM evaluation

    this.measurements.push(result);
    return result;
  }

  /**
   * Get ESLint score
   */
  getLintScore() {
    try {
      const frontendPath = path.join(this.projectPath, 'frontend');
      
      if (!fs.existsSync(frontendPath)) {
        return { error: 'Frontend path not found' };
      }

      const output = execSync(
        'npx eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx --format json 2>/dev/null || true',
        { 
          cwd: frontendPath,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024
        }
      );

      const results = JSON.parse(output || '[]');
      
      let totalErrors = 0;
      let totalWarnings = 0;
      let filesChecked = 0;

      for (const file of results) {
        totalErrors += file.errorCount;
        totalWarnings += file.warningCount;
        filesChecked++;
      }

      // Score: 10 = no errors/warnings, 0 = many errors
      const errorPenalty = totalErrors * 2;
      const warningPenalty = totalWarnings * 0.5;
      const score = Math.max(0, 10 - errorPenalty - warningPenalty);

      return {
        filesChecked,
        totalErrors,
        totalWarnings,
        score: Math.round(score * 10) / 10,
        passed: totalErrors === 0
      };
    } catch (error) {
      return { error: error.message, passed: false };
    }
  }

  /**
   * Get TypeScript strict check status
   */
  getTypeScriptStatus() {
    try {
      const frontendPath = path.join(this.projectPath, 'frontend');
      
      if (!fs.existsSync(path.join(frontendPath, 'tsconfig.json'))) {
        return { error: 'tsconfig.json not found', passed: false };
      }

      const output = execSync(
        'npx tsc --noEmit 2>&1 || true',
        { 
          cwd: frontendPath,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024
        }
      );

      const errorCount = (output.match(/error TS/g) || []).length;
      
      return {
        errorCount,
        output: output.slice(0, 1000), // Truncate
        passed: errorCount === 0
      };
    } catch (error) {
      return { error: error.message, passed: false };
    }
  }

  /**
   * Get test coverage
   */
  getTestCoverage() {
    try {
      // Frontend coverage
      const frontendPath = path.join(this.projectPath, 'frontend');
      const frontendResult = this.getFrontendCoverage(frontendPath);
      
      // Backend coverage
      const backendPath = path.join(this.projectPath, 'backend');
      const backendResult = this.getBackendCoverage(backendPath);

      return {
        frontend: frontendResult,
        backend: backendResult,
        average: this.calculateAverageCoverage(frontendResult, backendResult),
        passed: this.calculateAverageCoverage(frontendResult, backendResult) >= 80
      };
    } catch (error) {
      return { error: error.message, passed: false };
    }
  }

  /**
   * Get frontend test coverage
   */
  getFrontendCoverage(frontendPath) {
    try {
      if (!fs.existsSync(frontendPath)) {
        return { coverage: 0, error: 'Frontend path not found' };
      }

      const output = execSync(
        'npm run test:unit -- --coverage --reporter=json-summary 2>/dev/null || true',
        { 
          cwd: frontendPath,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 60000
        }
      );

      // Parse coverage from output or coverage file
      const coveragePath = path.join(frontendPath, 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return {
          lines: coverage.total?.lines?.pct || 0,
          statements: coverage.total?.statements?.pct || 0,
          branches: coverage.total?.branches?.pct || 0,
          functions: coverage.total?.functions?.pct || 0,
          coverage: coverage.total?.lines?.pct || 0
        };
      }

      // Try to extract from output
      const match = output.match(/All files[|\s]+(\d+\.?\d*)/);
      if (match) {
        return { coverage: parseFloat(match[1]) };
      }

      return { coverage: 0, note: 'No coverage data found' };
    } catch (error) {
      return { coverage: 0, error: error.message };
    }
  }

  /**
   * Get backend test coverage
   */
  getBackendCoverage(backendPath) {
    try {
      if (!fs.existsSync(backendPath)) {
        return { coverage: 0, error: 'Backend path not found' };
      }

      const output = execSync(
        'go test ./... -cover -json 2>/dev/null || true',
        { 
          cwd: backendPath,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 60000,
          env: { ...process.env, PATH: '/usr/local/go/bin:' + process.env.PATH }
        }
      );

      // Parse coverage from go test output
      const coverages = [];
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/coverage:\s*(\d+\.?\d*)%/);
        if (match) {
          coverages.push(parseFloat(match[1]));
        }
      }

      const avgCoverage = coverages.length > 0 
        ? coverages.reduce((a, b) => a + b, 0) / coverages.length 
        : 0;

      return {
        packages: coverages.length,
        coverage: Math.round(avgCoverage * 10) / 10
      };
    } catch (error) {
      return { coverage: 0, error: error.message };
    }
  }

  /**
   * Calculate average coverage
   */
  calculateAverageCoverage(frontend, backend) {
    const values = [frontend?.coverage, backend?.coverage].filter(v => v > 0);
    return values.length > 0 
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
  }

  /**
   * Set LLM-evaluated code quality score
   */
  setCodeQualityScore(taskId, score, details = {}) {
    const measurement = this.measurements.find(m => m.taskId === taskId);
    
    if (measurement) {
      measurement.codeQuality = {
        score,
        maxScore: 10,
        passed: score >= 7,
        ...details
      };
    }
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const lintScores = this.measurements
      .map(m => m.lint?.score)
      .filter(s => s !== null && s !== undefined);
    
    const coverages = this.measurements
      .map(m => m.coverage?.average)
      .filter(c => c !== null && c !== undefined);

    const typeScriptPasses = this.measurements
      .filter(m => m.typescript?.passed).length;

    const avgLintScore = lintScores.length > 0
      ? lintScores.reduce((a, b) => a + b, 0) / lintScores.length
      : 0;

    const avgCoverage = coverages.length > 0
      ? coverages.reduce((a, b) => a + b, 0) / coverages.length
      : 0;

    return {
      tasksMeasured: this.measurements.length,
      avgLintScore: Math.round(avgLintScore * 10) / 10,
      avgCoverage: Math.round(avgCoverage),
      typeScriptPassRate: this.measurements.length > 0
        ? (typeScriptPasses / this.measurements.length * 100).toFixed(1)
        : 0,
      qualityScore: this.calculateOverallQualityScore(avgLintScore, avgCoverage, typeScriptPasses, this.measurements.length)
    };
  }

  /**
   * Calculate overall quality score (0-10)
   */
  calculateOverallQualityScore(lint, coverage, tsPasses, total) {
    const lintScore = lint; // Already 0-10
    const coverageScore = coverage / 10; // Convert 0-100 to 0-10
    const tsScore = total > 0 ? (tsPasses / total) * 10 : 0;

    return Math.round((lintScore + coverageScore + tsScore) / 3 * 10) / 10;
  }

  /**
   * Export all data
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
    this.measurements = [];
  }
}

module.exports = { QualityCollector };
