/**
 * Reset Manager - Handles workspace reset between benchmarks
 * 
 * Since agency commits on task completion, we reset to baseline
 * to discard those commits and start fresh for each benchmark.
 */

const { execSync } = require('child_process');
const path = require('path');

class ResetManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.baselineTag = 'benchmark-baseline';
    this.baselineBranch = 'benchmark-base';
  }

  /**
   * Setup: Create baseline tag/branch at current state
   */
  setupBaseline() {
    console.log('\n📌 Setting up benchmark baseline...\n');
    
    try {
      // Check if baseline already exists
      execSync(`git rev-parse ${this.baselineTag} 2>/dev/null`, { 
        cwd: this.projectPath,
        stdio: 'pipe'
      });
      console.log(`   Baseline tag exists: ${this.baselineTag}`);
    } catch {
      // Create baseline tag
      execSync(`git tag ${this.baselineTag}`, { cwd: this.projectPath });
      console.log(`   ✅ Created baseline tag: ${this.baselineTag}`);
    }
    
    // Create baseline branch for easy checkout
    try {
      execSync(`git branch ${this.baselineBranch} 2>/dev/null`, { 
        cwd: this.projectPath,
        stdio: 'pipe'
      });
      console.log(`   Baseline branch exists: ${this.baselineBranch}`);
    } catch {
      execSync(`git branch ${this.baselineBranch}`, { cwd: this.projectPath });
      console.log(`   ✅ Created baseline branch: ${this.baselineBranch}`);
    }
    
    console.log('\n');
  }

  /**
   * Prepare: Reset to baseline before running task
   */
  prepare() {
    console.log('   🔄 Resetting workspace to baseline...');
    
    // Hard reset to baseline
    execSync(`git reset --hard ${this.baselineTag}`, { 
      cwd: this.projectPath,
      stdio: 'pipe'
    });
    
    // Remove untracked files
    execSync('git clean -fdx', { 
      cwd: this.projectPath,
      stdio: 'pipe'
    });
    
    // Reset node_modules (if needed)
    const nodeModulesPath = path.join(this.projectPath, 'frontend', 'node_modules');
    if (require('fs').existsSync(nodeModulesPath)) {
      console.log('   ℹ️  node_modules preserved (already installed)');
    }
    
    console.log('   ✅ Workspace clean\n');
  }

  /**
   * Reset: Discard all changes after task completion
   */
  reset() {
    console.log('   🧹 Discarding agency commits...');
    
    // Hard reset to baseline (discards commits)
    execSync(`git reset --hard ${this.baselineTag}`, { 
      cwd: this.projectPath,
      stdio: 'pipe'
    });
    
    // Remove untracked files
    execSync('git clean -fdx', { 
      cwd: this.projectPath,
      stdio: 'pipe'
    });
    
    console.log('   ✅ Workspace reset\n');
  }

  /**
   * Full reset: Complete cleanup including reinstall
   */
  fullReset() {
    console.log('\n🚀 Full reset (including reinstall)...\n');
    
    this.reset();
    
    // Reinstall dependencies
    const frontendPath = path.join(this.projectPath, 'frontend');
    const backendPath = path.join(this.projectPath, 'backend');
    
    if (require('fs').existsSync(frontendPath)) {
      console.log('   📦 Reinstalling frontend dependencies...');
      execSync('npm ci', { cwd: frontendPath, stdio: 'inherit' });
    }
    
    console.log('\n   ✅ Full reset complete\n');
  }

  /**
   * Get current state info
   */
  getState() {
    try {
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { 
        cwd: this.projectPath,
        encoding: 'utf8'
      }).trim();
      
      const lastCommit = execSync('git log -1 --oneline', { 
        cwd: this.projectPath,
        encoding: 'utf8'
      }).trim();
      
      const status = execSync('git status --short', { 
        cwd: this.projectPath,
        encoding: 'utf8'
      }).trim();
      
      const clean = status === '';
      
      return {
        currentBranch,
        lastCommit,
        isClean: clean,
        changedFiles: clean ? 0 : status.split('\n').length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Verify baseline exists
   */
  verifyBaseline() {
    try {
      execSync(`git rev-parse ${this.baselineTag}`, { 
        cwd: this.projectPath,
        stdio: 'pipe'
      });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { ResetManager };
