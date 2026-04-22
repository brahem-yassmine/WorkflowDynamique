const BaseStepHandler = require('./BaseStepHandler');

/**
 * Handles generic TASK steps.
 * A TASK step is purely for content execution/handling (e.g., filling a form, generating a report).
 * It waits for user input (submission) and strictly contains NO validation logic.
 */
class TaskStepHandler extends BaseStepHandler {
  
  async onAction(performer, action, data) {
    const { config } = this.step;
    // e.g. config.taskType = 'FORM' | 'PDF' | 'IMAGE'
    
    // Pure content execution: Just grab the submitted data and inject into context.
    const actionUpper = (action || 'SUBMITTED').toUpperCase();
    
    // We update the context with the task's payload under a namespaced key
    const contextUpdate = {
      [this.step.id]: {
        payload: data,
        submittedBy: performer._id,
        submittedAt: new Date()
      }
    };
    
    // The task logic is strictly content. Completes automatically once user submits.
    return { 
      completed: true, 
      action: actionUpper, 
      contextUpdate 
    };
  }
}

module.exports = TaskStepHandler;
