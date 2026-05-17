const BaseStepHandler = require('./BaseStepHandler');

/**
 * Handles CONDITION steps.
 * A CONDITION step does not wait for a user action. 
 * Once activated, it immediately completes and lets the WorkflowEngine 
 * evaluate its outgoing edges based on context logic.
 */
class ConditionStepHandler extends BaseStepHandler {
  
  async onActivate() {
    // Condition nodes are pure routing logic nodes.
    // They auto progress immediately. The true power lies in the Engine 
    // evaluating the outgoing edges from this node.
    return { 
      autoProgress: true, 
      nextAction: 'EVALUATE' 
    };
  }

  async onAction(performer, action, data) {
    // Since it's an auto-progress node, this won't be called under normal circumstances.
    throw new Error('Condition steps do not accept manual user actions.');
  }
}

module.exports = ConditionStepHandler;
