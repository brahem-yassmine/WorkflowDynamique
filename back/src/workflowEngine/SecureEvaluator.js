const vm = require('vm');

/**
 * SecureEvaluator handles condition evaluation and sandbox execution.
 */
class SecureEvaluator {
  /**
   * Evaluates a condition (DSL or raw string for back-compat).
   * @param {any} condition - The condition to evaluate.
   * @param {Object} context - The workflow instance context.
   * @param {string} action - The last performed action (e.g., 'APPROVED').
   * @returns {boolean}
   */
  static evaluateCondition(condition, context, action) {
    if (!condition) return true;

    // 1. Support JSON-DSL
    if (typeof condition === 'object') {
      return this._evaluateDSL(condition, context, action);
    }

    // 2. Support string evaluation (Legacy/Small scripts) with sandbox
    if (typeof condition === 'string') {
      try {
        const sandbox = { context, action, console };
        return vm.runInNewContext(condition, sandbox, { timeout: 1000 });
      } catch (err) {
        console.error('SecureEvaluator: String evaluation error:', err.message);
        return false;
      }
    }

    return false;
  }

  /**
   * Executes a script in a secure sandbox.
   * @param {string} script - The JS code to execute.
   * @param {Object} context - The workflow instance context to be modified.
   * @param {Object} libs - Injected libraries (e.g., date-fns, lodash).
   * @returns {Promise<Object>} - The modified context.
   */
  static async executeScript(script, context, libs = {}) {
    // Restricted sandbox
    const sandbox = {
      context: JSON.parse(JSON.stringify(context)), // Deep copy to avoid direct mutation errors
      ...libs,
      console: {
        log: (...args) => console.log('[Sandbox Log]:', ...args),
        error: (...args) => console.error('[Sandbox Error]:', ...args),
      }
    };

    try {
      vm.runInNewContext(script, sandbox, { 
        timeout: 5000, 
        displayErrors: true 
      });
      return sandbox.context;
    } catch (err) {
      console.error('SecureEvaluator: Script execution failed:', err.message);
      throw new Error(`AutoStep execution failed: ${err.message}`);
    }
  }

  /**
   * Resolves a value from context using dot notation (e.g., "context.user.name").
   */
  static _resolveValue(path, context, action) {
    if (path === 'action') return action;
    if (!path || typeof path !== 'string') return path;
    if (!path.startsWith('context.')) return path;

    const parts = path.substring(8).split('.');
    let current = context;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Processes the JSON-DSL logic.
   * Supports format: { "and": [ { "==": ["action", "APPROVED"] } ] }
   */
  static _evaluateDSL(dsl, context, action) {
    if (!dsl || typeof dsl !== 'object') return false;

    // Backward compatibility for old format { operator: '==', left: 'x', right: 'y', conditions: [] }
    if (dsl.operator) {
      const keysSupported = ['AND', 'OR', 'NOT', '==', '!=', '>', '<', '>=', '<=', 'CONTAINS'];
      const opIndex = keysSupported.indexOf(dsl.operator.toUpperCase());
      if (opIndex !== -1) {
        if (dsl.operator.toUpperCase() === 'AND') return (dsl.conditions || []).every(c => this._evaluateDSL(c, context, action));
        if (dsl.operator.toUpperCase() === 'OR') return (dsl.conditions || []).some(c => this._evaluateDSL(c, context, action));
        if (dsl.operator.toUpperCase() === 'NOT') return !this._evaluateDSL((dsl.conditions || [])[0], context, action);
        
        const lVal = this._resolveValue(dsl.left, context, action);
        const rVal = this._resolveValue(dsl.right, context, action);
        
        switch (dsl.operator.toUpperCase()) {
          case '==': case 'EQUALS': return lVal == rVal;
          case '!=': return lVal != rVal;
          case '>': return lVal > rVal;
          case '<': return lVal < rVal;
          case '>=': return lVal >= rVal;
          case '<=': return lVal <= rVal;
          case 'CONTAINS': return lVal && typeof lVal.includes === 'function' && lVal.includes(rVal);
        }
      }
    }

    // New JSONLogic format
    const keys = Object.keys(dsl);
    if (keys.length !== 1) return false; // Usually only one root operator
    
    const op = keys[0];
    const args = dsl[op];

    switch (op.toLowerCase()) {
      case 'and':
        return Array.isArray(args) && args.every(c => this._evaluateDSL(c, context, action));
      case 'or':
        return Array.isArray(args) && args.some(c => this._evaluateDSL(c, context, action));
      case 'not':
        return !this._evaluateDSL(Array.isArray(args) ? args[0] : args, context, action);
      case '==':
        return Array.isArray(args) && args.length === 2 && this._resolveValue(args[0], context, action) == this._resolveValue(args[1], context, action);
      case '!=':
        return Array.isArray(args) && args.length === 2 && this._resolveValue(args[0], context, action) != this._resolveValue(args[1], context, action);
      case '>':
        return Array.isArray(args) && args.length === 2 && this._resolveValue(args[0], context, action) > this._resolveValue(args[1], context, action);
      case '<':
        return Array.isArray(args) && args.length === 2 && this._resolveValue(args[0], context, action) < this._resolveValue(args[1], context, action);
      case '>=':
        return Array.isArray(args) && args.length === 2 && this._resolveValue(args[0], context, action) >= this._resolveValue(args[1], context, action);
      case '<=':
        return Array.isArray(args) && args.length === 2 && this._resolveValue(args[0], context, action) <= this._resolveValue(args[1], context, action);
      case 'contains':
        if (!Array.isArray(args) || args.length !== 2) return false;
        const contVal = this._resolveValue(args[0], context, action);
        return contVal && typeof contVal.includes === 'function' && contVal.includes(this._resolveValue(args[1], context, action));
      default:
        console.warn(`SecureEvaluator: Unknown DSL operator ${op}`);
        return false;
    }
  }
}

module.exports = SecureEvaluator;
