/**
 * Token Collector - Tracks token usage and costs
 */

class TokenCollector {
  constructor(pricing = null) {
    this.usage = [];
    this.pricing = pricing || {
      // Default OpenRouter pricing (approximate)
      'openrouter/google/gemini-2.5-flash-lite': { input: 0.000000075, output: 0.0000003 },
      'openrouter/openai/gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
      'openrouter/anthropic/claude-3.5-sonnet': { input: 0.000003, output: 0.000015 },
      'openrouter/z-ai/glm-5': { input: 0.0000001, output: 0.0000004 }
    };
  }

  /**
   * Record token usage
   */
  recordUsage(taskId, data) {
    const entry = {
      taskId,
      timestamp: new Date().toISOString(),
      model: data.model || 'unknown',
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      totalTokens: (data.inputTokens || 0) + (data.outputTokens || 0),
      cachedTokens: data.cachedTokens || 0,
      phase: data.phase || 'unknown'
    };

    // Calculate cost
    entry.cost = this.calculateCost(entry);
    
    this.usage.push(entry);
    return entry;
  }

  /**
   * Calculate cost for an entry
   */
  calculateCost(entry) {
    const pricing = this.pricing[entry.model];
    
    if (!pricing) {
      return 0;
    }

    const inputCost = entry.inputTokens * pricing.input;
    const outputCost = entry.outputTokens * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get total tokens for a task
   */
  getTaskTokens(taskId) {
    const taskUsage = this.usage.filter(u => u.taskId === taskId);
    
    return {
      inputTokens: taskUsage.reduce((sum, u) => sum + u.inputTokens, 0),
      outputTokens: taskUsage.reduce((sum, u) => sum + u.outputTokens, 0),
      totalTokens: taskUsage.reduce((sum, u) => sum + u.totalTokens, 0),
      cost: taskUsage.reduce((sum, u) => sum + u.cost, 0)
    };
  }

  /**
   * Get cost per line of code
   */
  getCostPerLOC(linesGenerated) {
    const totalCost = this.usage.reduce((sum, u) => sum + u.cost, 0);
    return linesGenerated > 0 ? totalCost / linesGenerated : 0;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const totalInput = this.usage.reduce((sum, u) => sum + u.inputTokens, 0);
    const totalOutput = this.usage.reduce((sum, u) => sum + u.outputTokens, 0);
    const totalCost = this.usage.reduce((sum, u) => sum + u.cost, 0);
    
    const taskIds = new Set(this.usage.map(u => u.taskId));
    const avgTokensPerTask = taskIds.size > 0 ? (totalInput + totalOutput) / taskIds.size : 0;
    const avgCostPerTask = taskIds.size > 0 ? totalCost / taskIds.size : 0;

    // Group by model
    const byModel = {};
    for (const entry of this.usage) {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { count: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      }
      byModel[entry.model].count++;
      byModel[entry.model].inputTokens += entry.inputTokens;
      byModel[entry.model].outputTokens += entry.outputTokens;
      byModel[entry.model].cost += entry.cost;
    }

    return {
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalTokens: totalInput + totalOutput,
      totalCost: totalCost,
      totalCostFormatted: `$${totalCost.toFixed(6)}`,
      tasksWithUsage: taskIds.size,
      avgTokensPerTask: Math.round(avgTokensPerTask),
      avgCostPerTask: avgCostPerTask,
      avgCostPerTaskFormatted: `$${avgCostPerTask.toFixed(6)}`,
      byModel
    };
  }

  /**
   * Set custom pricing
   */
  setPricing(model, inputPrice, outputPrice) {
    this.pricing[model] = { input: inputPrice, output: outputPrice };
  }

  /**
   * Export all data
   */
  export() {
    return {
      usage: this.usage,
      summary: this.getSummary()
    };
  }

  /**
   * Reset all data
   */
  reset() {
    this.usage = [];
  }
}

module.exports = { TokenCollector };
