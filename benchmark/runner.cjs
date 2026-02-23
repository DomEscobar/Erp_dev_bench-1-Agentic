#!/usr/bin/env node
/**
 * Benchmark Runner - Orchestrates agency benchmarks
 * 
 * Usage:
 *   node runner.cjs run <task-file>           - Run single benchmark
 *   node runner.cjs batch <task-dir>          - Run batch of benchmarks
 *   node runner.cjs report                    - Generate report
 *   node runner.cjs status                    - Show current status
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Import collectors
const { TimingCollector } = require('./collectors/timing');
const { ErrorCollector } = require('./collectors/errors');
const { TokenCollector } = require('./collectors/tokens');
const { QualityCollector } = require('./collectors/quality');
const { AgencyCollector } = require('./collectors/agency');
const { ResetManager } = require('./reset');

// Load config
const CONFIG_PATH = path.join(__dirname, 'config.json');
const RESULTS_PATH = path.join(__dirname, 'results.json');
const REPORTS_DIR = path.join(__dirname, 'reports');

class BenchmarkRunner {
  constructor() {
    this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // Initialize collectors
    this.timing = new TimingCollector();
    this.errors = new ErrorCollector();
    this.tokens = new TokenCollector();
    this.quality = new QualityCollector(this.config.projectPath);
    this.agency = new AgencyCollector(this.config.agencyPath);
    
    // Initialize reset manager
    this.reset = new ResetManager(this.config.projectPath);
    
    // Results storage
    this.results = this.loadResults();
  }

  /**
   * Load existing results
   */
  loadResults() {
    if (fs.existsSync(RESULTS_PATH)) {
      return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
    }
    return { runs: [], summary: null };
  }

  /**
   * Save results
   */
  saveResults() {
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(this.results, null, 2));
  }

  /**
   * Run a single benchmark task
   */
  async runTask(taskFile) {
    const task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    const taskId = task.id || `task-${Date.now()}`;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`BENCHMARK: ${task.name || taskId}`);
    console.log(`Description: ${task.description}`);
    console.log(`${'='.repeat(60)}\n`);

    // Initialize run record
    const run = {
      taskId,
      task,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'running',
      metrics: {}
    };

    // Start timers
    this.timing.startTimer(taskId, 'total');
    this.timing.startTimer(taskId, 'agency');

    try {
      // Execute agency
      console.log('🤖 Invoking agency...\n');
      
      const agencyResult = await this.invokeAgency(task);
      
      // Stop timers
      const totalTime = this.timing.stopTimer(taskId, 'total');
      const agencyTime = this.timing.stopTimer(taskId, 'agency');

      // Record agency result
      this.agency.recordTaskResult(taskId, {
        success: agencyResult.success,
        autonomous: agencyResult.autonomous,
        kpisPassed: agencyResult.kpisPassed || {},
        iterations: agencyResult.iterations || 0,
        pmOutput: agencyResult.pmOutput,
        discoveryOutput: agencyResult.discoveryOutput
      });

      // Record errors if any
      if (agencyResult.errors) {
        for (const error of agencyResult.errors) {
          this.errors.recordError(taskId, error);
        }
      }

      // Measure code quality
      console.log('\n📊 Measuring code quality...\n');
      const qualityMetrics = await this.quality.measure(taskId);
      console.log(`  Lint Score: ${qualityMetrics.lint?.score || 'N/A'}/10`);
      console.log(`  TypeScript: ${qualityMetrics.typescript?.passed ? '✅' : '❌'}`);
      console.log(`  Coverage: ${qualityMetrics.coverage?.average || 0}%`);

      // Record token usage if available
      if (agencyResult.tokenUsage) {
        this.tokens.recordUsage(taskId, agencyResult.tokenUsage);
      }

      // Complete run
      run.endTime = new Date().toISOString();
      run.status = agencyResult.success ? 'completed' : 'failed';
      run.durationMs = totalTime.durationMs;
      run.metrics = {
        timing: this.timing.getTaskMeasurements(taskId),
        quality: qualityMetrics,
        agency: this.agency.taskResults[this.agency.taskResults.length - 1]
      };

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`RESULT: ${run.status.toUpperCase()}`);
      console.log(`Duration: ${totalTime.durationSec}s`);
      console.log(`${'─'.repeat(60)}\n`);

    } catch (error) {
      // Handle execution errors
      this.errors.recordError(taskId, {
        type: 'execution',
        message: error.message,
        phase: 'agency-invocation',
        recoverable: false,
        stack: error.stack
      });

      run.endTime = new Date().toISOString();
      run.status = 'error';
      run.error = error.message;
      
      console.error(`\n❌ Error: ${error.message}\n`);
    }

    // Save run
    this.results.runs.push(run);
    this.saveResults();

    return run;
  }

  /**
   * Invoke the agency
   */
  async invokeAgency(task) {
    return new Promise((resolve, reject) => {
      const orchestratorPath = path.join(this.config.agencyPath, 'orchestrator.cjs');
      
      // Create task file for agency
      const taskFilePath = path.join(this.config.agencyPath, 'tasks', `benchmark-${task.id}.json`);
      fs.writeFileSync(taskFilePath, JSON.stringify({
        id: task.id,
        description: task.description,
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString()
      }, null, 2));

      // Spawn agency process
      const proc = spawn('node', [orchestratorPath, '--task', task.id], {
        cwd: this.config.agencyPath,
        env: { ...process.env, BENCHMARK_MODE: 'true' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data); // Echo output
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data); // Echo errors
      });

      proc.on('close', (code) => {
        // Parse agency output
        const result = this.parseAgencyOutput(stdout, stderr, code, task.id);
        resolve(result);
      });

      proc.on('error', (error) => {
        reject(error);
      });

      // Timeout
      setTimeout(() => {
        proc.kill();
        reject(new Error('Agency timeout exceeded'));
      }, (this.config.kpiThresholds.maxCompletionTimeMinutes || 30) * 60 * 1000);
    });
  }

  /**
   * Parse agency output
   */
  parseAgencyOutput(stdout, stderr, exitCode, taskId) {
    const result = {
      success: exitCode === 0,
      autonomous: true,
      kpisPassed: {
        typescript: false,
        lint: false,
        build: false,
        tests: false
      },
      iterations: 0,
      errors: [],
      tokenUsage: null
    };

    // Parse KPI status from output
    if (stdout.includes('TypeScript') || stdout.includes('type-check')) {
      result.kpisPassed.typescript = !stdout.includes('TS error') && !stderr.includes('TS error');
    }
    if (stdout.includes('ESLint') || stdout.includes('lint')) {
      result.kpisPassed.lint = !stdout.includes('✖') && !stdout.includes('error');
    }
    if (stdout.includes('build') || stdout.includes('vite build')) {
      result.kpisPassed.build = stdout.includes('built in') || !stdout.includes('failed');
    }
    if (stdout.includes('test') || stdout.includes('vitest')) {
      result.kpisPassed.tests = stdout.includes('passed') && !stdout.includes('failed');
    }

    // Count iterations (fix loops)
    const iterationMatches = stdout.match(/iteration|retry|fix loop/gi);
    result.iterations = iterationMatches ? iterationMatches.length : 1;

    // Parse token usage if available
    const tokenMatch = stdout.match(/tokens:\s*(\d+)\s*input,\s*(\d+)\s*output/i);
    if (tokenMatch) {
      result.tokenUsage = {
        inputTokens: parseInt(tokenMatch[1]),
        outputTokens: parseInt(tokenMatch[2]),
        model: 'unknown'
      };
    }

    // Extract errors
    const errorMatches = stdout.match(/error[:\s]+([^\n]+)/gi);
    if (errorMatches) {
      result.errors = errorMatches.map(e => ({
        type: 'runtime',
        message: e,
        phase: 'execution',
        recoverable: true
      }));
    }

    return result;
  }

  /**
   * Run batch of benchmarks
   */
  async runBatch(taskDir) {
    const taskFiles = fs.readdirSync(taskDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(taskDir, f));

    console.log(`\n📦 Running ${taskFiles.length} benchmark tasks...\n`);

    // Verify baseline exists, setup if not
    if (!this.reset.verifyBaseline()) {
      console.log('⚠️  No baseline found, setting up...\n');
      this.reset.setupBaseline();
    }

    const batchResults = [];
    
    for (let i = 0; i < taskFiles.length; i++) {
      const taskFile = taskFiles[i];
      console.log(`\n${'═'.repeat(50)}`);
      console.log(`TASK ${i + 1}/${taskFiles.length}`);
      console.log(`${'═'.repeat(50)}`);
      
      // Reset before each task (clean slate)
      this.reset.prepare();
      
      // Run benchmark
      const result = await this.runTask(taskFile);
      batchResults.push(result);
      
      // Reset after (discard agency commits)
      this.reset.reset();
      
      // Save intermediate results
      this.results.runs.push(result);
      this.saveResults();
    }

    // Generate batch summary
    this.generateSummary();
    
    return batchResults;
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    const summary = {
      generatedAt: new Date().toISOString(),
      totalRuns: this.results.runs.length,
      successRate: 0,
      avgDuration: 0,
      timing: this.timing.getSummary(),
      errors: this.errors.getSummary(),
      tokens: this.tokens.getSummary(),
      quality: this.quality.getSummary(),
      agency: this.agency.getSummary()
    };

    // Calculate success rate
    const successful = this.results.runs.filter(r => r.status === 'completed').length;
    summary.successRate = this.results.runs.length > 0
      ? (successful / this.results.runs.length * 100).toFixed(1)
      : 0;

    // Calculate average duration
    const durations = this.results.runs
      .filter(r => r.durationMs)
      .map(r => r.durationMs);
    summary.avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    this.results.summary = summary;
    this.saveResults();

    return summary;
  }

  /**
   * Generate report
   */
  generateReport(format = 'markdown') {
    const summary = this.results.summary || this.generateSummary();
    
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'markdown' || format === 'all') {
      const mdReport = this.generateMarkdownReport(summary);
      const mdPath = path.join(REPORTS_DIR, `benchmark-${timestamp}.md`);
      fs.writeFileSync(mdPath, mdReport);
      console.log(`\n📄 Markdown report: ${mdPath}`);
    }
    
    if (format === 'json' || format === 'all') {
      const jsonPath = path.join(REPORTS_DIR, `benchmark-${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
      console.log(`📊 JSON report: ${jsonPath}`);
    }

    return summary;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(summary) {
    const lines = [
      '# Agency Benchmark Report',
      '',
      `Generated: ${summary.generatedAt}`,
      '',
      '## Overview',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Runs | ${summary.totalRuns} |`,
      `| Success Rate | ${summary.successRate}% |`,
      `| Avg Duration | ${(summary.avgDuration / 1000).toFixed(1)}s |`,
      '',
      '## Performance',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Avg Completion Time | ${summary.timing?.avgCompletionTimeMin || 'N/A'} min |`,
      `| Throughput | ${summary.timing?.throughputPerHour || 'N/A'} tasks/hour |`,
      '',
      '## Quality',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Avg Lint Score | ${summary.quality?.avgLintScore || 'N/A'}/10 |`,
      `| Avg Coverage | ${summary.quality?.avgCoverage || 'N/A'}% |`,
      `| TypeScript Pass Rate | ${summary.quality?.typeScriptPassRate || 'N/A'}% |`,
      '',
      '## Agency Metrics',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Task Success Rate | ${summary.agency?.taskSuccess?.successRate || 'N/A'}% |`,
      `| Autonomous Rate | ${summary.agency?.taskSuccess?.autonomousRate || 'N/A'}% |`,
      `| First Try KPI Pass | ${summary.agency?.kpiStats?.firstTrySuccessRate || 'N/A'}% |`,
      `| Avg Iterations | ${summary.agency?.kpiStats?.avgIterations || 'N/A'} |`,
      '',
      '## Cost',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Tokens | ${summary.tokens?.totalTokens || 'N/A'} |`,
      `| Total Cost | ${summary.tokens?.totalCostFormatted || 'N/A'} |`,
      `| Avg Cost/Task | ${summary.tokens?.avgCostPerTaskFormatted || 'N/A'} |`,
      '',
      '## Errors',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Errors | ${summary.errors?.totalErrors || 0} |`,
      `| Total Retries | ${summary.errors?.totalRetries || 0} |`,
      `| Error Rate | ${summary.errors?.errorRate || 0} errors/task |`,
      '',
      '---',
      '*Generated by Benchmark Runner*'
    ];

    return lines.join('\n');
  }

  /**
   * Show current status
   */
  showStatus() {
    const summary = this.results.summary || this.generateSummary();
    
    console.log('\n📊 BENCHMARK STATUS\n');
    console.log(`Total Runs: ${summary.totalRuns}`);
    console.log(`Success Rate: ${summary.successRate}%`);
    console.log(`Avg Duration: ${(summary.avgDuration / 1000).toFixed(1)}s`);
    console.log('');
    console.log('Run `node runner.cjs report` to generate full report.\n');
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const runner = new BenchmarkRunner();
  
  switch (command) {
    case 'run':
      const taskFile = args[1];
      if (!taskFile) {
        console.error('Usage: node runner.cjs run <task-file>');
        process.exit(1);
      }
      // Reset before single run
      if (runner.reset.verifyBaseline()) {
        runner.reset.prepare();
      }
      await runner.runTask(taskFile);
      runner.reset.reset();
      break;
      
    case 'batch':
      const taskDir = args[1] || path.join(__dirname, 'tasks');
      await runner.runBatch(taskDir);
      break;
      
    case 'report':
      runner.generateReport('all');
      break;
      
    case 'status':
      runner.showStatus();
      break;
      
    case 'setup':
      runner.reset.setupBaseline();
      break;
      
    case 'reset':
      if (runner.reset.verifyBaseline()) {
        runner.reset.reset();
      } else {
        console.log('⚠️  No baseline found. Run `node runner.cjs setup` first.');
      }
      break;
      
    case 'full-reset':
      runner.reset.fullReset();
      break;
      
    default:
      console.log(`
Agency Benchmark Runner

Usage:
  node runner.cjs run <task>       Run single benchmark
  node runner.cjs batch [dir]      Run batch of benchmarks
  node runner.cjs report           Generate report (MD + JSON)
  node runner.cjs status           Show current status
  node runner.cjs setup            Create baseline snapshot
  node runner.cjs reset            Reset to baseline
  node runner.cjs full-reset       Full reset + reinstall
      `);
  }
}

main().catch(console.error);
